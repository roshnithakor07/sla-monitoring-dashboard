interface StatusBadgeProps {
  statusCode: number | null;
  dataQualityStatus: string;
}

export function StatusBadge({ statusCode, dataQualityStatus }: StatusBadgeProps) {
  if (dataQualityStatus === 'INVALID_STATUS') {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
        {statusCode ?? '?'} · invalid
      </span>
    );
  }

  const isSuccess = statusCode !== null && statusCode >= 200 && statusCode < 300;

  return (
    <span
      className={
        isSuccess
          ? 'inline-flex items-center rounded-full bg-[#0ca30c]/10 px-2 py-0.5 text-xs font-medium text-[#0ca30c]'
          : 'inline-flex items-center rounded-full bg-[#d03b3b]/10 px-2 py-0.5 text-xs font-medium text-[#d03b3b]'
      }
    >
      {statusCode}
    </span>
  );
}
