import { isKnownServiceId, SERVICE_ID_TO_NAME } from '../types';
import type { NormalizedCheckRow, RawCheckRow } from '../types';
import { normalizeTimestamp } from './timestamp';
import { normalizeLatency } from './latency';
import { classifyStatusCode } from './statusCode';

export type RowResult =
  | { accepted: true; row: NormalizedCheckRow }
  | { accepted: false; reason: string };

const REQUIRED_NON_EMPTY: (keyof RawCheckRow)[] = [
  'service_id',
  'service_name',
  'timestamp',
  'status_code',
  'latency_unit',
  'agent',
  'region',
];

/**
 * Validates and normalizes a single raw CSV row.
 *
 * A row is REJECTED (not persisted at all) only when it's structurally
 * unusable: a required field is missing, the service is unrecognized, or the
 * timestamp can't be parsed. Everything else (non-standard status code,
 * missing/negative latency) is normalized and persisted with a
 * dataQualityStatus flag instead of being silently dropped.
 */
export function processRow(raw: RawCheckRow): RowResult {
  for (const field of REQUIRED_NON_EMPTY) {
    if (!raw[field] || !raw[field].trim()) {
      return { accepted: false, reason: `missing required field: ${field}` };
    }
  }

  const serviceId = raw.service_id.trim();
  if (!isKnownServiceId(serviceId)) {
    return { accepted: false, reason: `unknown service_id: ${serviceId}` };
  }
  const expectedName = SERVICE_ID_TO_NAME[serviceId];
  if (raw.service_name.trim() !== expectedName) {
    return {
      accepted: false,
      reason: `service_name "${raw.service_name}" does not match service_id "${serviceId}" (expected "${expectedName}")`,
    };
  }

  const ts = normalizeTimestamp(raw.timestamp);
  if (!ts.ok) {
    return { accepted: false, reason: ts.reason };
  }

  const statusResult = classifyStatusCode(raw.status_code);
  const latencyResult = normalizeLatency(raw.latency, raw.latency_unit);

  const dataQualityStatus =
    statusResult.status === 'INVALID_STATUS' ? 'INVALID_STATUS' : latencyResult.status;

  return {
    accepted: true,
    row: {
      serviceId,
      serviceName: expectedName,
      timestamp: ts.value,
      statusCode: statusResult.code,
      latencyMs: latencyResult.valueMs,
      agent: raw.agent.trim(),
      region: raw.region.trim(),
      dataQualityStatus,
    },
  };
}
