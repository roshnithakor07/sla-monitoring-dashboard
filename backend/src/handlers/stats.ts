import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { statsQuerySchema } from '../validators/queryParams';
import { getOverallStats, getPerServiceStats } from '../repositories/statsRepository';
import { computeAvailability } from '../services/sla';
import { errorResponse, jsonResponse } from '../utils/response';
import { InvalidDateError } from '../utils/dateRange';

/** GET /api/stats?startDate&endDate&serviceId */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  try {
    const query = statsQuerySchema.parse(event.queryStringParameters ?? {});

    const [overall, perService] = await Promise.all([
      getOverallStats(query),
      getPerServiceStats(query),
    ]);

    const overallAvailability = computeAvailability(overall);

    return jsonResponse(200, {
      overall: {
        totalChecks: overall.totalChecks,
        successfulChecks: overall.successfulChecks,
        failedChecks: overallAvailability.failedChecks,
        invalidStatusCount: overall.invalidStatusCount,
        latencyMissingCount: overall.latencyMissingCount,
        latencyInvalidCount: overall.latencyInvalidCount,
        availabilityPct: overallAvailability.availabilityPct,
        avgLatencyMs: overall.avgLatencyMs,
        p95LatencyMs: overall.p95LatencyMs,
        slaThresholdPct: overallAvailability.slaThresholdPct,
        slaBreached: overallAvailability.slaBreached,
      },
      perService: perService.map((row) => {
        const availability = computeAvailability(row);
        return {
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          totalChecks: row.totalChecks,
          successfulChecks: row.successfulChecks,
          failedChecks: availability.failedChecks,
          invalidStatusCount: row.invalidStatusCount,
          availabilityPct: availability.availabilityPct,
          avgLatencyMs: row.avgLatencyMs,
          p95LatencyMs: row.p95LatencyMs,
          slaBreached: availability.slaBreached,
        };
      }),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(400, `Invalid query parameters: ${err.issues.map((i) => i.message).join(', ')}`);
    }
    if (err instanceof InvalidDateError) {
      return errorResponse(400, err.message);
    }
    console.error('Stats query failed:', err);
    return errorResponse(500, 'Internal error while computing statistics.');
  }
}
