import { parse } from 'csv-parse/sync';
import type { RawCheckRow } from '../types';

const EXPECTED_COLUMNS = [
  'service_id',
  'service_name',
  'timestamp',
  'status_code',
  'latency',
  'latency_unit',
  'agent',
  'region',
];

export class CsvStructureError extends Error {}

/**
 * Parses the raw CSV buffer into row objects keyed by the expected column
 * names. Throws CsvStructureError for problems that make the whole file
 * unusable (wrong/missing header) rather than trying to guess intent.
 * Per-row problems are handled later by processRow so partial files can
 * still be partially accepted.
 */
export function parseCsv(content: string): RawCheckRow[] {
  let records: Record<string, string>[];
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err) {
    throw new CsvStructureError(`Could not parse CSV: ${(err as Error).message}`);
  }

  if (records.length === 0) {
    throw new CsvStructureError('CSV file has no data rows');
  }

  const actualColumns = Object.keys(records[0]);
  const missing = EXPECTED_COLUMNS.filter((c) => !actualColumns.includes(c));
  if (missing.length > 0) {
    throw new CsvStructureError(`CSV is missing required column(s): ${missing.join(', ')}`);
  }

  return records as unknown as RawCheckRow[];
}
