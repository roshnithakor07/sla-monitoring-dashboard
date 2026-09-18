import { useEffect, useState } from 'react';
import { ApiError, fetchStats } from '../services/api';
import type { StatsResponse } from '../types';
import { StatCard } from './StatCard';
import { SlaBadge } from './SlaBadge';
import { formatCount, formatMs, formatPct } from '../utils/format';

interface StatsSectionProps {
  refreshKey: number;
}

export function StatsSection({ refreshKey }: StatsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStats({})
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load statistics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="stats-panel"
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Statistics</h2>
        <span className="text-sm text-slate-400">{expanded ? 'Collapse ▲' : 'Expand ▼'}</span>
      </button>

      {expanded && (
        <div id="stats-panel" className="mt-4">
          {loading && <p className="text-sm text-slate-500">Loading statistics…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && data && data.overall.totalChecks === 0 && (
            <p className="text-sm text-slate-500">No data yet — upload a CSV to see statistics.</p>
          )}

          {!loading && !error && data && data.overall.totalChecks > 0 && (
            <>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-slate-700">Overall</h3>
                <SlaBadge breached={data.overall.slaBreached} />
                <span className="text-xs text-slate-400">SLA threshold: {data.overall.slaThresholdPct}%</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Availability" value={formatPct(data.overall.availabilityPct)} />
                <StatCard label="Total checks" value={formatCount(data.overall.totalChecks)} />
                <StatCard label="Successful" value={formatCount(data.overall.successfulChecks)} tone="good" />
                <StatCard label="Failed" value={formatCount(data.overall.failedChecks)} tone="critical" />
                <StatCard label="Invalid / rejected" value={formatCount(data.overall.invalidStatusCount)} />
                <StatCard label="Missing/invalid latency" value={formatCount(data.overall.latencyMissingCount + data.overall.latencyInvalidCount)} />
                <StatCard label="Avg latency" value={formatMs(data.overall.avgLatencyMs)} />
                <StatCard label="P95 latency" value={formatMs(data.overall.p95LatencyMs)} />
              </div>

              <h3 className="mt-6 text-sm font-medium text-slate-700">Service-level summary</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4">Service</th>
                      <th className="py-2 pr-4">Availability</th>
                      <th className="py-2 pr-4">Checks</th>
                      <th className="py-2 pr-4">Failures</th>
                      <th className="py-2 pr-4">Avg latency</th>
                      <th className="py-2 pr-4">P95</th>
                      <th className="py-2 pr-4">SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perService.map((svc) => (
                      <tr key={svc.serviceId} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-800">{svc.serviceName}</td>
                        <td className="py-2 pr-4">{formatPct(svc.availabilityPct)}</td>
                        <td className="py-2 pr-4">{formatCount(svc.totalChecks)}</td>
                        <td className="py-2 pr-4">{formatCount(svc.failedChecks)}</td>
                        <td className="py-2 pr-4">{formatMs(svc.avgLatencyMs)}</td>
                        <td className="py-2 pr-4">{formatMs(svc.p95LatencyMs)}</td>
                        <td className="py-2 pr-4">
                          <SlaBadge breached={svc.slaBreached} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
