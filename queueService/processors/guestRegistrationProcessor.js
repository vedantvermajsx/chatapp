import { handleGuestRegistered } from '../controller/guest/handleGuestRegister.controller.js';

export function registerGuestRegistrationHandler(subscribe, on) {
  subscribe('guest.registered');
  on('guest.registered', handleGuestRegistered);
  console.log('[GuestRegistrationProcessor] subscribed to guest.registered');
}
