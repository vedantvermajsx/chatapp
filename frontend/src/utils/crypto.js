const AES_ALGO = { name: 'AES-GCM', length: 256 };
const RSA_ALGO = { name: 'RSA-OAEP', hash: 'SHA-256' };
const RSA_KEYGEN_ALGO = { ...RSA_ALGO, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };

function b64FromBuf(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function bufFromB64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function importAesKey(base64Key) {
  return crypto.subtle.importKey('raw', bufFromB64(base64Key), AES_ALGO, false, ['encrypt', 'decrypt']);
}

export function generateAesKeyB64() {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return b64FromBuf(raw.buffer);
}

function pemToBuf(pem) {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  return bufFromB64(b64);
}

function bufToPem(buf, label) {
  const b64 = b64FromBuf(buf);
  const lines = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

export async function generateRsaKeyPairPem() {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(RSA_KEYGEN_ALGO, true, ['encrypt', 'decrypt']);
  const [pubBuf, privBuf] = await Promise.all([
    crypto.subtle.exportKey('spki', publicKey),
    crypto.subtle.exportKey('pkcs8', privateKey),
  ]);
  return {
    publicKeyPem: bufToPem(pubBuf, 'PUBLIC KEY'),
    privateKeyPem: bufToPem(privBuf, 'PRIVATE KEY'),
  };
}

async function importRsaPublicKey(pem) {
  return crypto.subtle.importKey('spki', pemToBuf(pem), RSA_ALGO, false, ['encrypt']);
}

async function importRsaPrivateKey(pem) {
  return crypto.subtle.importKey('pkcs8', pemToBuf(pem), RSA_ALGO, false, ['decrypt']);
}

export async function wrapAesKeyForRecipient(aesKeyB64, recipientPublicKeyPem) {
  const pubKey = await importRsaPublicKey(recipientPublicKeyPem);
  const ciphertext = await crypto.subtle.encrypt(RSA_ALGO, pubKey, new TextEncoder().encode(aesKeyB64));
  return b64FromBuf(ciphertext);
}


export async function unwrapAesKey(wrappedB64, ownPrivateKeyPem) {
  const privKey = await importRsaPrivateKey(ownPrivateKeyPem);
  const plaintext = await crypto.subtle.decrypt(RSA_ALGO, privKey, bufFromB64(wrappedB64));
  return new TextDecoder().decode(plaintext);
}

async function aesEncrypt(aesKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );
  return { ivB64: b64FromBuf(iv), contentB64: b64FromBuf(ciphertext) };
}

async function aesDecrypt(aesKey, ivB64, contentB64) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bufFromB64(ivB64) },
    aesKey,
    bufFromB64(contentB64)
  );
  return new TextDecoder().decode(plaintext);
}

export async function encryptForRoom(plaintext, roomPublicKeyPem) {
  const messageKeyB64 = generateAesKeyB64();
  const messageKey = await importAesKey(messageKeyB64);
  const { ivB64, contentB64 } = await aesEncrypt(messageKey, plaintext);
  const wrappedKey = await wrapAesKeyForRecipient(messageKeyB64, roomPublicKeyPem);
  return { content: contentB64, iv: ivB64, wrappedKey };
}

export async function decryptForRoom(contentB64, ivB64, wrappedKey, roomPrivateKeyPem) {
  const messageKeyB64 = await unwrapAesKey(wrappedKey, roomPrivateKeyPem);
  const messageKey = await importAesKey(messageKeyB64);
  return aesDecrypt(messageKey, ivB64, contentB64);
}

export async function encryptPrivateMessage(plaintext, senderPublicKeyPem, receiverPublicKeyPem) {
  const messageKeyB64 = generateAesKeyB64();
  const messageKey = await importAesKey(messageKeyB64);
  const { ivB64, contentB64 } = await aesEncrypt(messageKey, plaintext);

  const [senderKeyWrapped, receiverKeyWrapped] = await Promise.all([
    wrapAesKeyForRecipient(messageKeyB64, senderPublicKeyPem),
    wrapAesKeyForRecipient(messageKeyB64, receiverPublicKeyPem),
  ]);

  return { content: contentB64, iv: ivB64, senderKeyWrapped, receiverKeyWrapped };
}

export async function decryptPrivateMessage(contentB64, ivB64, wrappedKeyForMe, ownPrivateKeyPem) {
  const messageKeyB64 = await unwrapAesKey(wrappedKeyForMe, ownPrivateKeyPem);
  const messageKey = await importAesKey(messageKeyB64);
  return aesDecrypt(messageKey, ivB64, contentB64);
}
