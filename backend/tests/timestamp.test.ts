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

  it('rejects epoch values that resolve outside a plausible year range', () => {
    const result = normalizeTimestamp('9999999999999');
    expect(result.ok).toBe(false);
  });
});
