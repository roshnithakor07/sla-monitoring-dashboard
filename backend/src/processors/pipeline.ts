import type { ImportSummary, NormalizedCheckRow } from '../types';
import { parseCsv } from './csvParser';
import { processRow } from './row';
import { dedupe } from './dedupe';

export interface PipelineResult {
  summary: ImportSummary;
  rows: NormalizedCheckRow[];
}

/**
 * Full parse -> validate -> normalize -> deduplicate pipeline.
 * Pure/stateless: takes CSV text, returns the cleaned rows to persist plus
 * a summary. Persistence itself lives in the repository layer so this stays
 * independently testable without a database.
 */
export function runPipeline(filename: string, content: string): PipelineResult {
  const rawRows = parseCsv(content);

  const accepted: NormalizedCheckRow[] = [];
  let rejectedRows = 0;

  for (const raw of rawRows) {
    const result = processRow(raw);
    if (result.accepted) {
      accepted.push(result.row);
    } else {
      rejectedRows += 1;
    }
  }

  const { rows, duplicateCount } = dedupe(accepted);

  const dataQuality = { invalidStatus: 0, latencyMissing: 0, latencyInvalid: 0 };
  for (const row of rows) {
    if (row.dataQualityStatus === 'INVALID_STATUS') dataQuality.invalidStatus += 1;
    else if (row.dataQualityStatus === 'LATENCY_MISSING') dataQuality.latencyMissing += 1;
    else if (row.dataQualityStatus === 'LATENCY_INVALID') dataQuality.latencyInvalid += 1;
  }

  return {
    summary: {
      filename,
      totalRows: rawRows.length,
      acceptedRows: rows.length,
      rejectedRows,
      duplicateRows: duplicateCount,
      dataQuality,
    },
    rows,
  };
}
