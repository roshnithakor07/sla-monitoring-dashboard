import { Prisma } from '@prisma/client';
import { buildDateRangeFilter } from '../utils/dateRange';

export interface BaseFilters {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
}

/** Shared date-range/service filter clauses for the stats and logs queries. */
export function buildFilterClauses(filters: BaseFilters): Prisma.Sql[] {
  const range = buildDateRangeFilter(filters.startDate, filters.endDate);
  const clauses: Prisma.Sql[] = [];
  if (range.gte) clauses.push(Prisma.sql`"timestamp" >= ${range.gte}`);
  if (range.lte) clauses.push(Prisma.sql`"timestamp" <= ${range.lte}`);
  if (filters.serviceId) clauses.push(Prisma.sql`"serviceId" = ${filters.serviceId}`);
  return clauses;
}

export function toWhere(clauses: Prisma.Sql[]): Prisma.Sql {
  return clauses.length > 0 ? Prisma.join(clauses, ' AND ') : Prisma.sql`TRUE`;
}
