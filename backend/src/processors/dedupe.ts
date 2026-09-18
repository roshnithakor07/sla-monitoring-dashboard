import type { NormalizedCheckRow } from '../types';

export interface DedupeResult {
  rows: NormalizedCheckRow[];
  duplicateCount: number;
}

function rowSignature(row: NormalizedCheckRow): string {
  return [
    row.statusCode,
    row.latencyMs,
    row.region,
    row.dataQualityStatus,
  ].join('|');
}

/**
 * Deduplicates by (serviceId, timestamp, agent).
 *
 * Two different agents observing the same service at the same timestamp are
 * NOT duplicates — the dataset legitimately contains independent multi-agent
 * observations, and both are kept (this is the majority of "same
 * service+timestamp" collisions found while inspecting the data).
 *
 * Within a single (serviceId, timestamp, agent) group:
 *   - If every row is identical, it's a true duplicate: keep the first, drop
 *     the rest.
 *   - If rows disagree (observed once in the sample data: one copy has a
 *     latency value, the other is blank), prefer the row with a non-null
 *     latency — it carries strictly more information. Ties break on file
 *     order for determinism.
 * Either way, everything beyond the kept row counts toward duplicateRows.
 */
export function dedupe(rows: NormalizedCheckRow[]): DedupeResult {
  const groups = new Map<string, NormalizedCheckRow[]>();
  const order: string[] = [];

  for (const row of rows) {
    const key = `${row.serviceId}|${row.timestamp.getTime()}|${row.agent}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(row);
  }

  const result: NormalizedCheckRow[] = [];
  let duplicateCount = 0;

  for (const key of order) {
    const group = groups.get(key)!;
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const allIdentical = group.every((r) => rowSignature(r) === rowSignature(group[0]));
    duplicateCount += group.length - 1;

    if (allIdentical) {
      result.push(group[0]);
      continue;
    }

    const withLatency = group.find((r) => r.latencyMs !== null);
    result.push(withLatency ?? group[0]);
  }

  return { rows: result, duplicateCount };
}
