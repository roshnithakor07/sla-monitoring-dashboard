import { describe, expect, it } from 'vitest';
import { computeAvailability, SLA_THRESHOLD_PCT } from '../src/services/sla';
import type { StatsRow } from '../src/repositories/statsRepository';

function stats(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    totalChecks: 100,
    validChecks: 100,
    successfulChecks: 100,
    invalidStatusCount: 0,
    latencyMissingCount: 0,
    latencyInvalidCount: 0,
    avgLatencyMs: 200,
    p95LatencyMs: 500,
    ...overrides,
  };
}

describe('computeAvailability', () => {
  it('is 100% when every valid check succeeded', () => {
    const result = computeAvailability(stats());
    expect(result.availabilityPct).toBe(100);
    expect(result.slaBreached).toBe(false);
  });

  it('flags an SLA breach below the 99.9% threshold', () => {
    const result = computeAvailability(stats({ validChecks: 1000, successfulChecks: 990 }));
    expect(result.availabilityPct).toBe(99);
    expect(result.slaBreached).toBe(true);
    expect(result.slaThresholdPct).toBe(SLA_THRESHOLD_PCT);
  });

  it('returns null (not 0 or 100) when there are no valid checks', () => {
    const result = computeAvailability(stats({ validChecks: 0, successfulChecks: 0 }));
    expect(result.availabilityPct).toBeNull();
    expect(result.slaBreached).toBeNull();
  });

  it('excludes invalid-status rows from both numerator and denominator', () => {
    // 10 total, 2 invalid-status, 8 valid, 6 successful -> 75%, not 60%
    const result = computeAvailability(
      stats({ totalChecks: 10, validChecks: 8, successfulChecks: 6, invalidStatusCount: 2 }),
    );
    expect(result.availabilityPct).toBe(75);
  });
});
