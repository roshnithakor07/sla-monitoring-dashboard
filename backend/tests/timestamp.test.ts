import { describe, expect, it } from 'vitest';
import { normalizeTimestamp } from '../src/processors/timestamp';

describe('normalizeTimestamp', () => {
  it('parses ISO 8601 with Z', () => {
    const result = normalizeTimestamp('2025-05-13T12:45:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('2025-05-13T12:45:00.000Z');
  });

  it('parses ISO 8601 with an explicit +05:30 offset and converts to UTC', () => {
    const result = normalizeTimestamp('2025-04-13T23:45:00+05:30');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('2025-04-13T18:15:00.000Z');
  });

  it('parses Unix epoch-seconds strings', () => {
    const result = normalizeTimestamp('1744349400');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('2025-04-11T05:30:00.000Z');
  });

  it('rejects empty timestamps', () => {
    const result = normalizeTimestamp('');
    expect(result.ok).toBe(false);
  });

  it('rejects garbage strings', () => {
    const result = normalizeTimestamp('not-a-date');
    expect(result.ok).toBe(false);
  });

  it('rejects an unparseable ISO-shaped string', () => {
    const result = normalizeTimestamp('2025-13-99T99:99:00Z');
    expect(result.ok).toBe(false);
  });

  it('accepts a 13-digit epoch-millis value regardless of the resulting year', () => {
    // No year-plausibility window is enforced -- see timestamp.ts's comment
    // for why. This value resolves to 2286, and that's fine: it's a
    // syntactically valid epoch-millis string, not an unrecoverable one.
    const result = normalizeTimestamp('9999999999999');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.getUTCFullYear()).toBe(2286);
  });

  it('accepts a syntactically valid ISO timestamp from 1999 (no arbitrary year floor)', () => {
    // Regression test: the spec's "don't assume the date range" instruction
    // and its "invalid = unparseable" definition mean a real, parseable
    // date outside some assumed window must not be rejected.
    const result = normalizeTimestamp('1999-12-31T23:59:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('1999-12-31T23:59:00.000Z');
  });

  it('accepts a syntactically valid far-future ISO timestamp (no arbitrary year ceiling)', () => {
    const result = normalizeTimestamp('2999-01-01T00:00:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('2999-01-01T00:00:00.000Z');
  });
});
