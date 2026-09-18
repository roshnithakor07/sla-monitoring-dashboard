import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { logsQuerySchema } from '../validators/queryParams';
import { getLogs } from '../repositories/logsRepository';
import { errorResponse, jsonResponse } from '../utils/response';
import { InvalidDateError } from '../utils/dateRange';

/** GET /api/logs?startDate&endDate&serviceId&status&page&limit */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  try {
    const query = logsQuerySchema.parse(event.queryStringParameters ?? {});
    const { page, limit, ...filters } = query;

    const { rows, totalCount } = await getLogs(filters, page, limit);

    return jsonResponse(200, {
      data: rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(400, `Invalid query parameters: ${err.issues.map((i) => i.message).join(', ')}`);
    }
    if (err instanceof InvalidDateError) {
      return errorResponse(400, err.message);
    }
    console.error('Logs query failed:', err);
    return errorResponse(500, 'Internal error while fetching logs.');
  }
}
