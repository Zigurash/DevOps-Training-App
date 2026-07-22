import { StatusDot } from '@/components/ui/Skeleton';
import type { HealthResponse } from '@/types';

export function HealthSummary({ health }: { health?: HealthResponse }) {
  if (!health) {
    return <span className="text-sm text-slate-400">Checking…</span>;
  }

  return (
    <div className="space-y-2 text-sm">
      <StatusDot ok={health.status === 'ok'} label={`App ${health.status}`} />
      <StatusDot
        ok={health.database.status === 'connected'}
        label={`DB ${health.database.status}`}
      />
    </div>
  );
}
