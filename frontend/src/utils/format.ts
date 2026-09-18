export function formatPct(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)}%`;
}

export function formatMs(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value).toLocaleString()} ms`;
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}
