import { z } from 'zod';
import { SERVICE_IDS } from '../types';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .optional();

export const statsQuerySchema = z.object({
  startDate: dateString,
  endDate: dateString,
  serviceId: z.enum(SERVICE_IDS as [string, ...string[]]).optional(),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;

export const logsQuerySchema = z.object({
  startDate: dateString,
  endDate: dateString,
  serviceId: z.enum(SERVICE_IDS as [string, ...string[]]).optional(),
  // Exact HTTP status code (e.g. "200", "502"), or the literal "invalid" to
  // match rows flagged INVALID_STATUS regardless of their raw code.
  status: z.string().regex(/^(\d{1,3}|invalid)$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type LogsQuery = z.infer<typeof logsQuerySchema>;
