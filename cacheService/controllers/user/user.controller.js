/**
 * User controllers for cacheService
 *
 * POST /users/seed            ← called by queueService after it writes User to Mongo
 * POST /users/check-duplicate ← backend pre-publish duplicate guard (reads only)
 * GET  /users/:id             ← cache-first read with Mongo cold-miss fallback
 * GET  /users/by-username/:name
 * DELETE /users/:id/cache     ← invalidate on profile update
 *
 * What is NOT here: no User.create(), no Mongo writes.
 * All writes happen in queueService/processors/userRegistrationProcessor.js.
 */

import UserCacheService from '../../services/UserCacheService.js';

// ── POST /users/seed ──────────────────────────────────────────────────────────
// Body: full user document that queueService just persisted to Mongo.
// Seeds the cache so the next GET is a cache hit — no Mongo read needed.

export async function seedUser(req, res) {
  try {
    const userDoc = req.body;
    if (!userDoc._id || !userDoc.username) {
      return res.status(400).json({ message: '_id and username are required' });
    }
    UserCacheService.seedUser(userDoc);
    return res.json({ seeded: true });
  } catch (err) {
    console.error('[UserController] seedUser error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /users/check-duplicate ───────────────────────────────────────────────
// Body: { username, email }
// Returns: { taken: false } | { taken: true, field: 'email'|'username' }
// Pure reads — cache first, Mongo cold-miss fallback. No writes.

export async function checkDuplicate(req, res) {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'username and email are required' });
    }
    const result = await UserCacheService.checkDuplicate(username, email);
    return res.json(result);
  } catch (err) {
    console.error('[UserController] checkDuplicate error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /users/:id ────────────────────────────────────────────────────────────

export async function getUserById(req, res) {
  try {
    const user = await UserCacheService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[UserController] getUserById error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /users/by-username/:name ──────────────────────────────────────────────

export async function getUserByUsername(req, res) {
  try {
    const user = await UserCacheService.getUserByUsername(req.params.name);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[UserController] getUserByUsername error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /users/:id/cache ───────────────────────────────────────────────────

export async function invalidateUserCache(req, res) {
  try {
    UserCacheService.invalidate(req.params.id);
    return res.json({ invalidated: true });
  } catch (err) {
    console.error('[UserController] invalidateUserCache error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
