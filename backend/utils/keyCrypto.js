import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

//shared key generated 1:1 for room
export function generateSymmetricKey() {
  return crypto.randomBytes(32).toString('base64');
}
const SECRET = crypto.createHash('sha256').update(process.env.KEY_ENCRYPTION_SECRET || 'dev-fallback-secret-change-me').digest();


export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}


 //Encrypts a private key PEM for storage at rest.
export function encryptPrivateKey(privateKeyPem) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, SECRET, iv);
  const ciphertext = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

 // Decrypts a stored private key back to PEM. 
export function decryptPrivateKey(encrypted) {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGO, SECRET, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}


function deriveKeyFromPassword(password, saltHex) {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 32);
}

export function encryptPrivateKeyWithPassword(privateKeyPem, password) {
  const salt = crypto.randomBytes(16);
  const key = deriveKeyFromPassword(password, salt.toString('hex'));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`,
    salt: salt.toString('hex'),
  };
}


export function decryptPrivateKeyWithPassword(encrypted, saltHex, password) {
  const key = deriveKeyFromPassword(password, saltHex);
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
