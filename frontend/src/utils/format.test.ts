import { describe, expect, it } from 'vitest';
import { formatCount, formatMs, formatPct, formatTimestamp } from './format';

describe('formatPct', () => {
  it('formats a percentage to 2 decimal places', () => {
    expect(formatPct(98.74369040942233)).toBe('98.74%');
  });

  it('renders null as an em dash, not 0%', () => {
    expect(formatPct(null)).toBe('—');
  });
});

describe('formatMs', () => {
  it('rounds and adds a unit suffix', () => {
    expect(formatMs(365.667)).toBe('366 ms');
  });

  it('renders null as an em dash, not 0 ms', () => {
    expect(formatMs(null)).toBe('—');
  });
});

describe('formatCount', () => {
  it('adds thousands separators', () => {
    expect(formatCount(44580)).toBe('44,580');
  });
});

describe('formatTimestamp', () => {
  it('renders an explicit UTC suffix rather than relying on locale', () => {
    expect(formatTimestamp('2025-04-11T05:30:00.000Z')).toBe('2025-04-11 05:30:00 UTC');
  });
});
