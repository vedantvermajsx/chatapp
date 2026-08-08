import PrivateChatKey from '../../models/privateChatKey.model.js';
import { generateKeyPair, encryptPrivateKey, decryptPrivateKey } from '../../utils/keyCrypto.js';
import { getPairId } from '../../utils/pairId.js';

export async function getPrivateChatKey(req, res) {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'otherUserId required' });
    }
    if (String(userId) === String(otherUserId)) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    const pairId = getPairId(userId, otherUserId);

    let chatKey = await PrivateChatKey.findById(pairId).select('+privateKeyEncrypted');

    if (!chatKey) {
      const { publicKey, privateKey } = generateKeyPair();
      try {
        chatKey = await PrivateChatKey.create({
          _id: pairId,
          participants: [String(userId), String(otherUserId)].sort(),
          publicKey,
          privateKeyEncrypted: encryptPrivateKey(privateKey),
        });
        return res.json({ publicKey, privateKey });
      } catch (err) {
        if (err.code === 11000) {
          chatKey = await PrivateChatKey.findById(pairId).select('+privateKeyEncrypted');
        } else {
          throw err;
        }
      }
    }

    if (!chatKey) {
      return res.status(500).json({ message: 'Failed to get or create chat key' });
    }

    const privateKey = chatKey.privateKeyEncrypted ? decryptPrivateKey(chatKey.privateKeyEncrypted) : null;
    return res.json({ publicKey: chatKey.publicKey, privateKey });
  } catch (err) {
    console.error('[getPrivateChatKey] error:', err.message);
    return res.status(500).json({ message: err.message });
  }
}
