import type { DataQualityStatus } from '../types';

export interface LatencyResult {
  valueMs: number | null;
  status: Extract<DataQualityStatus, 'CLEAN' | 'LATENCY_MISSING' | 'LATENCY_INVALID'>;
  reason?: string;
}

const KNOWN_UNITS = new Set(['ms', 's']);

/**
 * Converts latency to milliseconds. Missing values and negative/unparseable
 * values are NOT dropped — they're kept with a flag so the pipeline can
 * report exactly how many records were affected (per the assignment's data
 * quality UI requirement), and excluded from latency aggregates downstream.
 */
export function normalizeLatency(raw: string, unit: string): LatencyResult {
  const value = raw?.trim();
  if (!value) {
    return { valueMs: null, status: 'LATENCY_MISSING' };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { valueMs: null, status: 'LATENCY_INVALID', reason: `non-numeric latency: ${raw}` };
  }
  if (parsed < 0) {
    return { valueMs: null, status: 'LATENCY_INVALID', reason: `negative latency: ${raw}` };
  }

  const normalizedUnit = unit?.trim();
  if (!KNOWN_UNITS.has(normalizedUnit)) {
    return { valueMs: null, status: 'LATENCY_INVALID', reason: `unknown latency unit: ${unit}` };
  }

  const valueMs = normalizedUnit === 's' ? parsed * 1000 : parsed;
  return { valueMs, status: 'CLEAN' };
}
