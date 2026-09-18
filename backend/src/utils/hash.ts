import { createHash } from 'node:crypto';

/** SHA-256 of the raw CSV content, used to detect re-upload of the exact same file. */
export function contentHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}
