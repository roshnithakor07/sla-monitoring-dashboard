import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CsvStructureError } from '../processors/csvParser';
import { runPipeline } from '../processors/pipeline';
import { findImportByContentHash, persistImport } from '../repositories/importRepository';
import { errorResponse, jsonResponse } from '../utils/response';
import { contentHash } from '../utils/hash';

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

/**
 * POST /api/upload
 *
 * Accepts the raw CSV file as the request body (Content-Type: text/csv),
 * with the original filename passed via the X-Filename header. A plain-body
 * upload was chosen over multipart/form-data because the supplied datasets
 * are a few MB at most and this Lambda does nothing else with the request:
 * multipart parsing would add a dependency and complexity with no benefit
 * at this scale (documented in README).
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  try {
    if (!event.body) {
      return errorResponse(400, 'Request body is empty; expected raw CSV content.');
    }

    const content = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;

    const byteLength = Buffer.byteLength(content, 'utf-8');
    if (byteLength > MAX_UPLOAD_BYTES) {
      return errorResponse(
        413,
        `File is too large (${byteLength} bytes). Maximum accepted size is ${MAX_UPLOAD_BYTES} bytes.`,
      );
    }

    const filename = event.headers?.['x-filename'] ?? event.headers?.['X-Filename'] ?? 'upload.csv';
    const hash = contentHash(content);

    // Whole-file re-upload check, BEFORE running the pipeline: re-submitting
    // the exact same file should never persist a second copy of its rows.
    // See importRepository.ts for why this is file-level, not row-level.
    const existing = await findImportByContentHash(hash);
    if (existing) {
      const { summary } = runPipeline(filename, content);
      return jsonResponse(200, {
        ...summary,
        acceptedRows: 0,
        duplicateRows: summary.totalRows,
        duplicateOfImport: { filename: existing.filename, uploadedAt: existing.uploadedAt.toISOString() },
      });
    }

    const { summary, rows } = runPipeline(filename, content);
    const finalSummary = await persistImport(summary, rows, hash);

    return jsonResponse(200, finalSummary);
  } catch (err) {
    if (err instanceof CsvStructureError) {
      return errorResponse(400, err.message);
    }
    console.error('Upload processing failed:', err);
    return errorResponse(500, 'Internal error while processing the upload.');
  }
}
