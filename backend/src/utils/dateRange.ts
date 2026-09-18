const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class InvalidDateError extends Error {}

/**
 * Parses a 'YYYY-MM-DD' string into the UTC instant at the start of that
 * calendar day. Deliberately does NOT use `new Date('YYYY-MM-DD')` directly
 * in a way that could be reinterpreted in local time -- constructing via
 * Date.UTC keeps this timezone-safe regardless of server locale.
 */
export function parseUtcDateStart(raw: string): Date {
  if (!DATE_ONLY.test(raw)) {
    throw new InvalidDateError(`Expected a date in YYYY-MM-DD format, got: ${raw}`);
  }
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new InvalidDateError(`Not a real calendar date: ${raw}`);
  }
  return date;
}

/** The UTC instant one millisecond before the start of the NEXT day (i.e. the end of `raw`'s day). */
export function parseUtcDateEnd(raw: string): Date {
  const start = parseUtcDateStart(raw);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export interface DateRangeFilter {
  gte?: Date;
  lte?: Date;
}

/**
 * Builds a Prisma-ready range from optional startDate/endDate query params.
 * A single date (startDate only, or startDate === endDate) covers that whole
 * UTC calendar day. A range covers the start of the first date through the
 * end of the last date, inclusive.
 */
export function buildDateRangeFilter(startDate?: string, endDate?: string): DateRangeFilter {
  const filter: DateRangeFilter = {};
  if (startDate) filter.gte = parseUtcDateStart(startDate);
  if (endDate) filter.lte = parseUtcDateEnd(endDate);
  else if (startDate) filter.lte = parseUtcDateEnd(startDate);
  return filter;
}
