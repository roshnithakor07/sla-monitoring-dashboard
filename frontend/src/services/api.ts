import axios from 'axios';
import type { ImportSummary, LogsFilters, LogsResponse, StatsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const client = axios.create({ baseURL: API_BASE_URL });

export class ApiError extends Error {}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.error;
    if (typeof message === 'string') return message;
    if (err.code === 'ERR_NETWORK') return 'Could not reach the server. Check your connection and try again.';
    return err.message;
  }
  return 'Something went wrong.';
}

export async function uploadCsv(file: File): Promise<ImportSummary> {
  const content = await file.text();
  try {
    const res = await client.post<ImportSummary>('/api/upload', content, {
      headers: { 'Content-Type': 'text/csv', 'X-Filename': file.name },
    });
    return res.data;
  } catch (err) {
    throw new ApiError(extractErrorMessage(err));
  }
}

export interface StatsFilters {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
}

export async function fetchStats(filters: StatsFilters): Promise<StatsResponse> {
  try {
    const res = await client.get<StatsResponse>('/api/stats', { params: filters });
    return res.data;
  } catch (err) {
    throw new ApiError(extractErrorMessage(err));
  }
}

export async function fetchLogs(
  filters: LogsFilters,
  page: number,
  limit: number,
): Promise<LogsResponse> {
  try {
    const res = await client.get<LogsResponse>('/api/logs', {
      params: { ...filters, page, limit },
    });
    return res.data;
  } catch (err) {
    throw new ApiError(extractErrorMessage(err));
  }
}
