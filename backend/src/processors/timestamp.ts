export type TimestampResult = { ok: true; value: Date } | { ok: false; reason: string };

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UNIX_SECONDS = /^\d{9,10}$/;
const UNIX_MILLIS = /^\d{12,13}$/;

/**
 * Normalizes the three timestamp formats found in the supplied datasets to a
 * UTC Date: ISO 8601 with 'Z', ISO 8601 with an explicit offset (e.g.
 * +05:30), and Unix epoch-seconds numeric strings. Epoch-millis strings are
 * accepted defensively even though none were observed in the sample data.
 *
 * No year-plausibility window is enforced. The spec defines "invalid" as
 * unparseable/unrecoverable, not "outside an expected range" -- and
 * explicitly warns not to assume the data's date range. A syntactically
 * valid ISO date is accepted regardless of year (verified: 1999 and 2999
 * both parse correctly). For epoch strings, the 9-10/12-13 digit-length
 * gates below already correspond to a realistic epoch range (~1973-2286)
 * as a side effect of disambiguating seconds from milliseconds, and
 * `Number(value)` on a digit-only string is always finite, so `new
 * Date(millis)` can't produce an Invalid Date here -- there is nothing left
 * to sanity-check beyond that.
 */
export function normalizeTimestamp(raw: string): TimestampResult {
  const value = raw?.trim();
  if (!value) {
    return { ok: false, reason: 'empty timestamp' };
  }

  if (UNIX_SECONDS.test(value) || UNIX_MILLIS.test(value)) {
    const millis = UNIX_SECONDS.test(value) ? Number(value) * 1000 : Number(value);
    return { ok: true, value: new Date(millis) };
  }

  if (ISO_LIKE.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, reason: `unparseable ISO timestamp: ${value}` };
    }
    return { ok: true, value: date };
  }

  return { ok: false, reason: `unrecognized timestamp format: ${value}` };
}
