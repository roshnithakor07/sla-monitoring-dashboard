import type { DataQualityStatus } from '../types';

export interface StatusCodeResult {
  code: number | null;
  status: Extract<DataQualityStatus, 'CLEAN' | 'INVALID_STATUS'>;
}

/**
 * Classifies the raw status_code string.
 *
 * Policy (documented in README): any code in the standard HTTP range
 * 100-599 is treated as structurally valid ("CLEAN" here just means "a real
 * HTTP status", not "successful" — 2xx vs non-2xx success classification
 * happens later at query time). Anything outside that range, or non-numeric,
 * is a data-quality issue (e.g. the 999 sentinel found in every supplied
 * file) and is flagged INVALID_STATUS rather than being silently remapped
 * to some other code.
 */
export function classifyStatusCode(raw: string): StatusCodeResult {
  const value = raw?.trim();
  if (!/^\d+$/.test(value)) {
    return { code: null, status: 'INVALID_STATUS' };
  }
  const code = Number(value);
  if (code < 100 || code > 599) {
    return { code, status: 'INVALID_STATUS' };
  }
  return { code, status: 'CLEAN' };
}
