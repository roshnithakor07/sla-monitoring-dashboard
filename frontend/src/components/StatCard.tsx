interface StatCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'critical';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-900',
  good: 'text-[#0ca30c]',
  critical: 'text-[#d03b3b]',
};

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  );
}
