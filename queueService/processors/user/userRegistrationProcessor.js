
export function registerUserRegistrationHandler(subscribe, on) {
  subscribe('user.registered');
  on('user.registered', handleUserRegistered);
  console.log('[UserRegistrationProcessor] subscribed to user.registered');
}
