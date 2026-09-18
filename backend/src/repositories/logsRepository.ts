import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';
import { buildFilterClauses, toWhere, type BaseFilters } from './queryFilters';

export interface LogsFilters extends BaseFilters {
  /** Exact HTTP status code as a string (e.g. "200"), or "invalid". */
  status?: string;
}

export interface LogRow {
  id: string;
  serviceId: string;
  serviceName: string;
  timestamp: Date;
  statusCode: number | null;
  latencyMs: number | null;
  agent: string;
  region: string;
  dataQualityStatus: string;
}

function statusClause(status?: string): Prisma.Sql | null {
  if (!status) return null;
  if (status === 'invalid') return Prisma.sql`"dataQualityStatus" = 'INVALID_STATUS'`;
  return Prisma.sql`"statusCode" = ${Number(status)}`;
}

export async function getLogs(
  filters: LogsFilters,
  page: number,
  limit: number,
): Promise<{ rows: LogRow[]; totalCount: number }> {
  const clauses = buildFilterClauses(filters);
  const status = statusClause(filters.status);
  if (status) clauses.push(status);
  const where = toWhere(clauses);

  const [rows, countResult] = await Promise.all([
    prisma.$queryRaw<LogRow[]>(Prisma.sql`
      SELECT id, "serviceId", "serviceName", "timestamp", "statusCode", "latencyMs", agent, region, "dataQualityStatus"
      FROM "MonitoringCheck"
      WHERE ${where}
      ORDER BY "timestamp" DESC, id
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `),
    prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM "MonitoringCheck" WHERE ${where}
    `),
  ]);

  return { rows, totalCount: countResult[0].count };
}
