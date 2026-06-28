/**
 * UserRegistrationProcessor
 *
 * Consumes the 'user.registered' broker event published by the backend.
*    1. Write User document to MongoDB.
 *   2. POST /users/seed to cacheService so the cache is warm immediately.
 *
 * On duplicate key error (race between duplicate-check and write) we log
 * and drop the event — the backend already returned 202 so there is nothing
 * else to do.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

dotenv.config();

const cache = axios.create({
  baseURL: process.env.CACHE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 3000
});

async function handleUserRegistered(userData) {
  const { _id, username, email } = userData;

  try {
    const user = await User.create({
      ...userData,
      _id: new mongoose.Types.ObjectId(_id),
    });
    console.log(`[UserRegistrationProcessor] created user ${user._id} (${username})`);

    try {
      await cache.post('/users/seed', user.toObject());
    } catch (cacheErr) {
      console.warn(
        `[UserRegistrationProcessor] cache seed failed for ${user._id}:`,
        cacheErr.message
      );
    }
  } catch (err) {
    if (err.code === 11000) {
      console.warn(
        `[UserRegistrationProcessor] duplicate user ignored: ${username} / ${email}`
      );
      return;
    }
    console.error(`[UserRegistrationProcessor] failed to create user ${username}:`, err.message);
    throw err;
  }
}

export function registerUserRegistrationHandler(subscribe, on) {
  subscribe('user.registered');
  on('user.registered', handleUserRegistered);
  console.log('[UserRegistrationProcessor] subscribed to user.registered');
}
