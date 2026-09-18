export type TimestampResult = { ok: true; value: Date } | { ok: false; reason: string };

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UNIX_SECONDS = /^\d{9,10}$/;
const UNIX_MILLIS = /^\d{12,13}$/;

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

/**
 * Normalizes the three timestamp formats found in the supplied datasets to a
 * UTC Date: ISO 8601 with 'Z', ISO 8601 with an explicit offset (e.g.
 * +05:30), and Unix epoch-seconds numeric strings. Epoch-millis strings are
 * accepted defensively even though none were observed in the sample data.
 */
export function normalizeTimestamp(raw: string): TimestampResult {
  const value = raw?.trim();
  if (!value) {
    return { ok: false, reason: 'empty timestamp' };
  }

  if (UNIX_SECONDS.test(value) || UNIX_MILLIS.test(value)) {
    const millis = UNIX_SECONDS.test(value) ? Number(value) * 1000 : Number(value);
    const date = new Date(millis);
    if (!isYearInRange(date)) {
      return { ok: false, reason: `epoch timestamp out of plausible range: ${value}` };
    }
    return { ok: true, value: date };
  }

  if (ISO_LIKE.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, reason: `unparseable ISO timestamp: ${value}` };
    }
    if (!isYearInRange(date)) {
      return { ok: false, reason: `ISO timestamp out of plausible range: ${value}` };
    }
    return { ok: true, value: date };
  }

  return { ok: false, reason: `unrecognized timestamp format: ${value}` };
}

function isYearInRange(date: Date): boolean {
  const year = date.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}
