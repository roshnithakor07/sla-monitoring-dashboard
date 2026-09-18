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

// Always displayed in UTC, explicitly labeled, rather than the viewer's local
// timezone -- avoids the classic JS date bug where the same instant renders
// differently depending on where the browser happens to be.
export function formatTimestamp(iso: string): string {
  return `${iso.slice(0, 19).replace('T', ' ')} UTC`;
}
