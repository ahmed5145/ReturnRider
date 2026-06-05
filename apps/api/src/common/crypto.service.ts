import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Copy into a fresh buffer so Prisma Bytes (Uint8Array<ArrayBuffer>) type-checks. */
function toPrismaBytes(data: Buffer): Prisma.Bytes {
  const bytes = new Uint8Array(data.length);
  bytes.set(data);
  return bytes;
}

@Injectable()
export class CryptoService {
  private getMasterKey(): Buffer {
    const hex = process.env.ENCRYPTION_MASTER_KEY;
    if (!hex || hex.length !== 64) {
      throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
  }

  encrypt(plaintext: string, keyId = 'default'): { ciphertext: Prisma.Bytes; keyId: string } {
    const key = this.getMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([iv, tag, encrypted]);
    return { ciphertext: toPrismaBytes(ciphertext), keyId };
  }

  decrypt(ciphertext: Uint8Array | Buffer): string {
    const buf = Buffer.from(ciphertext);
    const key = this.getMasterKey();
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const data = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
