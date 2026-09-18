import { describe, expect, it } from 'vitest';
import { processRow } from '../src/processors/row';
import type { RawCheckRow } from '../src/types';

function baseRow(overrides: Partial<RawCheckRow> = {}): RawCheckRow {
  return {
    service_id: 'svc-auth',
    service_name: 'auth-api',
    timestamp: '2025-05-13T12:45:00Z',
    status_code: '200',
    latency: '150',
    latency_unit: 'ms',
    agent: 'agent-1',
    region: 'ap-south-1',
    ...overrides,
  };
}

describe('processRow', () => {
  it('accepts a well-formed clean row', () => {
    const result = processRow(baseRow());
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.row.dataQualityStatus).toBe('CLEAN');
      expect(result.row.latencyMs).toBe(150);
    }
  });

  it('rejects an unknown service_id rather than persisting it', () => {
    const result = processRow(baseRow({ service_id: 'svc-unknown' }));
    expect(result.accepted).toBe(false);
  });

  it('rejects a service_name that does not match its service_id', () => {
    const result = processRow(baseRow({ service_name: 'search-api' }));
    expect(result.accepted).toBe(false);
  });

  it('rejects a row with a missing required field', () => {
    const result = processRow(baseRow({ agent: '' }));
    expect(result.accepted).toBe(false);
  });

  it('rejects a row with an unparseable timestamp', () => {
    const result = processRow(baseRow({ timestamp: 'not-a-date' }));
    expect(result.accepted).toBe(false);
  });

  it('accepts (not rejects) a row with status 999, flagged INVALID_STATUS', () => {
    const result = processRow(baseRow({ status_code: '999' }));
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(result.row.dataQualityStatus).toBe('INVALID_STATUS');
  });

  it('accepts a row with missing latency, flagged LATENCY_MISSING', () => {
    const result = processRow(baseRow({ latency: '' }));
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(result.row.dataQualityStatus).toBe('LATENCY_MISSING');
  });

  it('an invalid status code takes priority over a latency issue in the row-level flag', () => {
    const result = processRow(baseRow({ status_code: '999', latency: '' }));
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(result.row.dataQualityStatus).toBe('INVALID_STATUS');
  });
});
