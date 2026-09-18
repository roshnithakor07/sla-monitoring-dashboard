import { describe, expect, it } from 'vitest';
import { dedupe } from '../src/processors/dedupe';
import type { NormalizedCheckRow } from '../src/types';

function row(overrides: Partial<NormalizedCheckRow> = {}): NormalizedCheckRow {
  return {
    serviceId: 'svc-auth',
    serviceName: 'auth-api',
    timestamp: new Date('2025-05-13T12:45:00Z'),
    statusCode: 200,
    latencyMs: 150,
    agent: 'agent-1',
    region: 'ap-south-1',
    dataQualityStatus: 'CLEAN',
    ...overrides,
  };
}

describe('dedupe', () => {
  it('keeps a single row untouched', () => {
    const result = dedupe([row()]);
    expect(result.rows).toHaveLength(1);
    expect(result.duplicateCount).toBe(0);
  });

  it('drops exact duplicate rows (same service+timestamp+agent+payload)', () => {
    const result = dedupe([row(), row()]);
    expect(result.rows).toHaveLength(1);
    expect(result.duplicateCount).toBe(1);
  });

  it('keeps both rows for the same service+timestamp when agents differ (legitimate multi-agent observation)', () => {
    const result = dedupe([row({ agent: 'agent-1' }), row({ agent: 'agent-2' })]);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicateCount).toBe(0);
  });

  it('on a conflicting duplicate, prefers the row with a valid latency over a blank one', () => {
    const withLatency = row({ latencyMs: 269 });
    const withoutLatency = row({ latencyMs: null, dataQualityStatus: 'LATENCY_MISSING' });
    const result = dedupe([withoutLatency, withLatency]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].latencyMs).toBe(269);
    expect(result.duplicateCount).toBe(1);
  });
});
