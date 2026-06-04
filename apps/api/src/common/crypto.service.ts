import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class CryptoService {
  private getMasterKey(): Buffer {
    const hex = process.env.ENCRYPTION_MASTER_KEY;
    if (!hex || hex.length !== 64) {
      throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
  }

  encrypt(plaintext: string, keyId = 'default'): { ciphertext: Buffer; keyId: string } {
    const key = this.getMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([iv, tag, encrypted]);
    return { ciphertext, keyId };
  }

  decrypt(ciphertext: Buffer): string {
    const key = this.getMasterKey();
    const iv = ciphertext.subarray(0, IV_LENGTH);
    const tag = ciphertext.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const data = ciphertext.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
