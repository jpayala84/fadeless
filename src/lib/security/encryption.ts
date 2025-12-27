import crypto from 'node:crypto';

import { getEnv } from '@/lib/env';

let cachedKey: Buffer | null = null;
const getKey = () => {
  if (cachedKey) {
    return cachedKey;
  }
  const secret = getEnv().ENCRYPTION_SECRET;
  cachedKey = crypto.createHash('sha256').update(secret).digest();
  return cachedKey;
};

const IV_LENGTH = 12;

export const encrypt = (plaintext: string) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

export const decrypt = (ciphertext: string) => {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = data.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};
