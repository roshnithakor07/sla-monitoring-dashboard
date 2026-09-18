import { useEffect, useState } from 'react';
import { ApiError, fetchLogs } from '../services/api';
import type { LogsResponse } from '../types';
import { SERVICE_IDS } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatMs, formatTimestamp } from '../utils/format';

interface LogsSectionProps {
  refreshKey: number;
}

const LIMIT = 25;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: '200', label: '200' },
  { value: '500', label: '500' },
  { value: '502', label: '502' },
  { value: '503', label: '503' },
  { value: 'invalid', label: 'Invalid' },
];

interface FilterState {
  startDate: string;
  endDate: string;
  serviceId: string;
  status: string;
}

const EMPTY_FILTERS: FilterState = { startDate: '', endDate: '', serviceId: '', status: '' };

function hasActiveFilters(f: FilterState): boolean {
  return Boolean(f.startDate || f.endDate || f.serviceId || f.status);
}

function chipsFor(f: FilterState): { key: keyof FilterState; label: string }[] {
  const chips: { key: keyof FilterState; label: string }[] = [];
  if (f.startDate) chips.push({ key: 'startDate', label: `From ${f.startDate}` });
  if (f.endDate) chips.push({ key: 'endDate', label: `To ${f.endDate}` });
  if (f.serviceId) chips.push({ key: 'serviceId', label: f.serviceId });
  if (f.status) chips.push({ key: 'status', label: `Status ${f.status}` });
  return chips;
}

export function LogsSection({ refreshKey }: LogsSectionProps) {
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogsResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);

    const filters = {
      startDate: appliedFilters.startDate || undefined,
      endDate: appliedFilters.endDate || undefined,
      serviceId: appliedFilters.serviceId || undefined,
      status: appliedFilters.status || undefined,
    };

    fetchLogs(filters, page, LIMIT)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load logs.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsFetching(false);
        setHasLoadedOnce(true);
      });

    return () => {
      cancelled = true;
    };
    // appliedFilters + page are the single source of truth for the query;
    // refreshKey forces a refetch after a successful upload.
  }, [appliedFilters, page, refreshKey]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function resetFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setPage(1);
    setAppliedFilters(EMPTY_FILTERS);
  }

  function removeFilter(key: keyof FilterState) {
    const next = { ...appliedFilters, [key]: '' };
    setDraftFilters(next);
    setPage(1);
    setAppliedFilters(next);
  }

  const totalPages = data?.pagination.totalPages ?? 1;
  const activeChips = chipsFor(appliedFilters);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Logs</h2>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Date from</label>
          <input
            type="date"
            value={draftFilters.startDate}
            onChange={(e) => setDraftFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="mt-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Date to</label>
          <input
            type="date"
            value={draftFilters.endDate}
            onChange={(e) => setDraftFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="mt-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Service</label>
          <select
            value={draftFilters.serviceId}
            onChange={(e) => setDraftFilters((f) => ({ ...f, serviceId: e.target.value }))}
            className="mt-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {SERVICE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Status</label>
          <select
            value={draftFilters.status}
            onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))}
            className="mt-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={resetFilters}
            disabled={isFetching}
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={applyFilters}
            disabled={isFetching}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isFetching && <ButtonSpinner />}
            {isFetching ? 'Applying…' : 'Apply filters'}
          </button>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Active filters:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeFilter(chip.key)}
              disabled={isFetching}
              title={`Remove ${chip.label}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-4 min-h-[120px]">
        {isFetching && hasLoadedOnce && (
          <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/70 pt-8">
            <Spinner />
          </div>
        )}

        {!hasLoadedOnce && isFetching && <TableSkeleton />}

        {hasLoadedOnce && error && !data && <p className="text-sm text-red-600">{error}</p>}

        {hasLoadedOnce && data && data.data.length === 0 && (
          <p className="text-sm text-slate-500">
            {hasActiveFilters(appliedFilters)
              ? 'No records found for the selected filters.'
              : 'No records yet — upload a CSV to see logs.'}
          </p>
        )}

        {hasLoadedOnce && data && data.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Latency</th>
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Region</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs text-slate-600">{formatTimestamp(row.timestamp)}</td>
                    <td className="py-2 pr-4">{row.serviceName}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge statusCode={row.statusCode} dataQualityStatus={row.dataQualityStatus} />
                    </td>
                    <td className="py-2 pr-4">{formatMs(row.latencyMs)}</td>
                    <td className="py-2 pr-4 text-slate-500">{row.agent}</td>
                    <td className="py-2 pr-4 text-slate-500">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasLoadedOnce && error && data && (
          <p className="mt-2 text-sm text-red-600">{error} — showing the last successfully loaded page.</p>
        )}
      </div>

      {hasLoadedOnce && data && data.pagination.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {data.pagination.page} of {totalPages} · {data.pagination.totalCount.toLocaleString()} records
            {isFetching && <span className="ml-2 text-slate-400">Updating…</span>}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ButtonSpinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}
