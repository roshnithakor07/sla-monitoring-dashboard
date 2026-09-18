import { useRef, useState } from 'react';
import { ApiError, uploadCsv } from '../services/api';
import type { ImportSummary } from '../types';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface UploadPanelProps {
  onUploadSuccess: (summary: ImportSummary) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<ImportSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setStatus('idle');

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.');
      setFile(null);
      return;
    }
    if (selected.size === 0) {
      setError('That file is empty.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large (${formatBytes(selected.size)}). Maximum is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      const summary = await uploadCsv(file);
      setLastSummary(summary);
      setStatus('idle');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploadSuccess(summary);
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upload CSV</h2>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Choose file
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={status === 'uploading'}
          />
        </label>

        {file && (
          <span className="text-sm text-slate-600">
            {file.name} · {formatBytes(file.size)}
          </span>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="ml-auto rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {lastSummary && status !== 'uploading' && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-800">
            Processed {lastSummary.totalRows.toLocaleString()} rows from {lastSummary.filename}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-slate-600 sm:grid-cols-3">
            <div>
              <dt className="inline text-slate-500">Accepted: </dt>
              <dd className="inline font-medium text-slate-800">{lastSummary.acceptedRows.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="inline text-slate-500">Rejected: </dt>
              <dd className="inline font-medium text-slate-800">{lastSummary.rejectedRows.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="inline text-slate-500">Duplicates removed: </dt>
              <dd className="inline font-medium text-slate-800">{lastSummary.duplicateRows.toLocaleString()}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            Data quality flags in accepted rows — invalid status: {lastSummary.dataQuality.invalidStatus}, missing
            latency: {lastSummary.dataQuality.latencyMissing}, invalid latency: {lastSummary.dataQuality.latencyInvalid}
          </p>
        </div>
      )}
    </section>
  );
}
