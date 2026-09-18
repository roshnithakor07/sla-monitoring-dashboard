import { UploadPanel } from './components/UploadPanel';

function App() {
  function handleUploadSuccess() {
    // Stats/logs sections will refetch on upload once they exist.
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
      </main>
    </div>
  );
}

export default App;
