import { randomBytes } from 'crypto';

export const generateGuestId = () => `guest_${randomBytes(8).toString('hex')}`;