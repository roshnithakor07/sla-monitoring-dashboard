import { useState } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { StatsSection } from './components/StatsSection';
import { LogsSection } from './components/LogsSection';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploadSuccess() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-semibold">SLA Monitoring Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <UploadPanel onUploadSuccess={handleUploadSuccess} />
        <StatsSection refreshKey={refreshKey} />
        <LogsSection refreshKey={refreshKey} />
      </main>
    </div>
  );
}

export default App;
