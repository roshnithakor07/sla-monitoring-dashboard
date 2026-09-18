import { describe, expect, it } from 'vitest';
import { normalizeLatency } from '../src/processors/latency';

describe('normalizeLatency', () => {
  it('passes ms values through unchanged', () => {
    expect(normalizeLatency('100', 'ms')).toEqual({ valueMs: 100, status: 'CLEAN' });
  });

  it('converts seconds to milliseconds', () => {
    expect(normalizeLatency('0.5', 's')).toEqual({ valueMs: 500, status: 'CLEAN' });
  });

  it('flags missing latency without dropping the row', () => {
    const result = normalizeLatency('', 'ms');
    expect(result.status).toBe('LATENCY_MISSING');
    expect(result.valueMs).toBeNull();
  });

  it('rejects negative latency as invalid, not silently absolute-valued', () => {
    const result = normalizeLatency('-296', 'ms');
    expect(result.status).toBe('LATENCY_INVALID');
    expect(result.valueMs).toBeNull();
  });

  it('rejects non-numeric latency', () => {
    const result = normalizeLatency('abc', 'ms');
    expect(result.status).toBe('LATENCY_INVALID');
  });

  it('rejects an unrecognized unit', () => {
    const result = normalizeLatency('100', 'minutes');
    expect(result.status).toBe('LATENCY_INVALID');
  });
});
