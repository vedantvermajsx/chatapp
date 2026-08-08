import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import { generateKeyPair, encryptPrivateKeyWithPassword, decryptPrivateKeyWithPassword } from '../../utils/keyCrypto.js';
import { handleAuthSuccess } from './auth.helper.js';

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    const refactoredUsername = username.trim().toLowerCase();

    if (!refactoredUsername || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username: refactoredUsername }).select('+privateKeyEncrypted +keySalt');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    let privateKey = null;
    if (!user.publicKey || !user.privateKeyEncrypted || !user.keySalt) {
      try {
        const keyPair = generateKeyPair();
        const { encrypted, salt } = encryptPrivateKeyWithPassword(keyPair.privateKey, password);
        user.publicKey = keyPair.publicKey;
        user.privateKeyEncrypted = encrypted;
        user.keySalt = salt;
        privateKey = keyPair.privateKey;
        await User.findByIdAndUpdate(user._id, {
          publicKey: user.publicKey,
          privateKeyEncrypted: user.privateKeyEncrypted,
          keySalt: user.keySalt,
        });
      } catch (e) {
        console.error('[login] legacy key generation error:', e.message);
      }
    } else {
      try {
        privateKey = decryptPrivateKeyWithPassword(user.privateKeyEncrypted, user.keySalt, password);
      } catch (e) {
        console.error('[login] privateKey decrypt error:', e.message);
      }
    }

    await handleAuthSuccess(res, user, 'user', privateKey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
