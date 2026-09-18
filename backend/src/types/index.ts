export const SERVICE_IDS = [
  'svc-auth',
  'svc-search',
  'svc-payments',
  'svc-notify',
  'svc-reports',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];
