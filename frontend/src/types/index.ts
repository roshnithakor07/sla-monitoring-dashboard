export const SERVICE_IDS = [
  'svc-auth',
  'svc-search',
  'svc-payments',
  'svc-notify',
  'svc-reports',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type DataQualityStatus = 'CLEAN' | 'INVALID_STATUS' | 'LATENCY_MISSING' | 'LATENCY_INVALID';

export interface ImportSummary {
  filename: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  dataQuality: {
    invalidStatus: number;
    latencyMissing: number;
    latencyInvalid: number;
  };
}

export interface OverallStats {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  invalidStatusCount: number;
  latencyMissingCount: number;
  latencyInvalidCount: number;
  availabilityPct: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  slaThresholdPct: number;
  slaBreached: boolean | null;
}

export interface ServiceStats {
  serviceId: string;
  serviceName: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  invalidStatusCount: number;
  availabilityPct: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  slaBreached: boolean | null;
}

export interface StatsResponse {
  overall: OverallStats;
  perService: ServiceStats[];
}

export interface LogRow {
  id: string;
  serviceId: string;
  serviceName: string;
  timestamp: string;
  statusCode: number | null;
  latencyMs: number | null;
  agent: string;
  region: string;
  dataQualityStatus: DataQualityStatus;
}

export interface LogsResponse {
  data: LogRow[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface LogsFilters {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
  status?: string;
}
