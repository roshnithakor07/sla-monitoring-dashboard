import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';
import { buildFilterClauses, toWhere, type BaseFilters } from './queryFilters';

export interface StatsRow {
  totalChecks: number;
  validChecks: number;
  successfulChecks: number;
  invalidStatusCount: number;
  latencyMissingCount: number;
  latencyInvalidCount: number;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
}

export interface ServiceStatsRow extends StatsRow {
  serviceId: string;
  serviceName: string;
}

/**
 * Shared aggregate expression list. Everything here is computed by
 * PostgreSQL, not fetched row-by-row and reduced in Node -- see the
 * "Performance" section of the assignment spec.
 *
 * validChecks / successfulChecks exclude INVALID_STATUS rows (we can't say
 * whether an unclassifiable check succeeded or failed). avgLatencyMs /
 * p95LatencyMs are computed over any row with a non-null latencyMs,
 * independent of status validity -- latency is a separately-measured axis.
 */
const AGGREGATE_COLUMNS = Prisma.sql`
  COUNT(*)::int AS "totalChecks",
  COUNT(*) FILTER (WHERE "dataQualityStatus" <> 'INVALID_STATUS')::int AS "validChecks",
  COUNT(*) FILTER (WHERE "dataQualityStatus" <> 'INVALID_STATUS' AND "statusCode" BETWEEN 200 AND 299)::int AS "successfulChecks",
  COUNT(*) FILTER (WHERE "dataQualityStatus" = 'INVALID_STATUS')::int AS "invalidStatusCount",
  COUNT(*) FILTER (WHERE "dataQualityStatus" = 'LATENCY_MISSING')::int AS "latencyMissingCount",
  COUNT(*) FILTER (WHERE "dataQualityStatus" = 'LATENCY_INVALID')::int AS "latencyInvalidCount",
  AVG("latencyMs") FILTER (WHERE "latencyMs" IS NOT NULL) AS "avgLatencyMs",
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latencyMs") FILTER (WHERE "latencyMs" IS NOT NULL) AS "p95LatencyMs"
`;

export async function getOverallStats(filters: BaseFilters): Promise<StatsRow> {
  const where = toWhere(buildFilterClauses(filters));
  const rows = await prisma.$queryRaw<StatsRow[]>(Prisma.sql`
    SELECT ${AGGREGATE_COLUMNS}
    FROM "MonitoringCheck"
    WHERE ${where}
  `);
  return rows[0];
}

export async function getPerServiceStats(filters: BaseFilters): Promise<ServiceStatsRow[]> {
  const where = toWhere(buildFilterClauses(filters));
  return prisma.$queryRaw<ServiceStatsRow[]>(Prisma.sql`
    SELECT "serviceId", "serviceName", ${AGGREGATE_COLUMNS}
    FROM "MonitoringCheck"
    WHERE ${where}
    GROUP BY "serviceId", "serviceName"
    ORDER BY "serviceId"
  `);
}
