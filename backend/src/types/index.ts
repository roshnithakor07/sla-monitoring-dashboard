export const SERVICE_ID_TO_NAME = {
  'svc-auth': 'auth-api',
  'svc-search': 'search-api',
  'svc-payments': 'payments-api',
  'svc-notify': 'notify-worker',
  'svc-reports': 'reports-api',
} as const;

export type ServiceId = keyof typeof SERVICE_ID_TO_NAME;

export const SERVICE_IDS = Object.keys(SERVICE_ID_TO_NAME) as ServiceId[];

export function isKnownServiceId(value: string): value is ServiceId {
  return Object.prototype.hasOwnProperty.call(SERVICE_ID_TO_NAME, value);
}

/** The 8 raw string columns as they appear in the supplied CSVs. */
export interface RawCheckRow {
  service_id: string;
  service_name: string;
  timestamp: string;
  status_code: string;
  latency: string;
  latency_unit: string;
  agent: string;
  region: string;
}

export type DataQualityStatus = 'CLEAN' | 'INVALID_STATUS' | 'LATENCY_MISSING' | 'LATENCY_INVALID';

/** A row that survived structural validation and was normalized. */
export interface NormalizedCheckRow {
  serviceId: ServiceId;
  serviceName: string;
  timestamp: Date;
  statusCode: number | null;
  latencyMs: number | null;
  agent: string;
  region: string;
  dataQualityStatus: DataQualityStatus;
}

/** A row that could not be structurally validated and was dropped before persistence. */
export interface RejectedRow {
  rowNumber: number;
  reason: string;
  raw: Partial<RawCheckRow>;
}

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
