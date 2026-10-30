import { getBan } from '../ban/getBan.js';

export const getActiveBan = (userId) => getBan(userId);
