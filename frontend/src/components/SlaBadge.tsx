interface SlaBadgeProps {
  breached: boolean | null;
}

export function SlaBadge({ breached }: SlaBadgeProps) {
  if (breached === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        No data
      </span>
    );
  }

  if (breached) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#d03b3b]/10 px-2 py-0.5 text-xs font-medium text-[#d03b3b]">
        ● SLA breach
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#0ca30c]/10 px-2 py-0.5 text-xs font-medium text-[#0ca30c]">
      ● Within SLA
    </span>
  );
}
