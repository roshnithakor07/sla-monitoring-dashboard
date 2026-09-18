import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CsvStructureError } from '../processors/csvParser';
import { runPipeline } from '../processors/pipeline';
import { persistImport } from '../repositories/importRepository';
import { errorResponse, jsonResponse } from '../utils/response';

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

    const { summary, rows } = runPipeline(filename, content);
    await persistImport(summary, rows);

    return jsonResponse(200, summary);
  } catch (err) {
    if (err instanceof CsvStructureError) {
      return errorResponse(400, err.message);
    }
    console.error('Upload processing failed:', err);
    return errorResponse(500, 'Internal error while processing the upload.');
  }
}
