import type { StatsRow } from '../repositories/statsRepository';

/**
 * Reference SLA threshold from the case study background ("99.9%
 * availability"). This is a documented reference line for the dashboard,
 * not a claim that every service has a contractual 99.9% SLA -- see README.
 */
export const SLA_THRESHOLD_PCT = 99.9;

export interface AvailabilityResult {
  availabilityPct: number | null;
  failedChecks: number;
  slaThresholdPct: number;
  slaBreached: boolean | null;
}

/**
 * availability = successfulChecks / validChecks * 100, where validChecks
 * excludes INVALID_STATUS rows. Returns null availability (not 0 or 100)
 * when there are zero valid checks, since "no data" and "100% healthy" are
 * different things the UI should distinguish.
 */
export function computeAvailability(stats: StatsRow): AvailabilityResult {
  const availabilityPct =
    stats.validChecks > 0 ? (stats.successfulChecks / stats.validChecks) * 100 : null;

  return {
    availabilityPct,
    failedChecks: stats.validChecks - stats.successfulChecks,
    slaThresholdPct: SLA_THRESHOLD_PCT,
    slaBreached: availabilityPct === null ? null : availabilityPct < SLA_THRESHOLD_PCT,
  };
}
