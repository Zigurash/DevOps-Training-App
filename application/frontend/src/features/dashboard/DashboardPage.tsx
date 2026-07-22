import { useQuery } from '@tanstack/react-query';
import {
  eventsApi,
  healthApi,
  loadApi,
  metricsApi,
  systemApi,
} from '@/services/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, StatusDot } from '@/components/ui/Skeleton';
import { formatBytes, formatTime, formatUptime } from '@/lib/utils';

function parseRequestTotal(metrics: string | undefined): number {
  if (!metrics) return 0;
  const lines = metrics.split('\n').filter(
    (l) => l.startsWith('http_requests_total{') && !l.startsWith('#'),
  );
  return lines.reduce((sum, line) => {
    const parts = line.trim().split(' ');
    const value = Number(parts[parts.length - 1]);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function DashboardPage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 5000,
  });
  const system = useQuery({
    queryKey: ['system'],
    queryFn: systemApi.info,
    refetchInterval: 5000,
  });
  const jobs = useQuery({
    queryKey: ['load-jobs'],
    queryFn: loadApi.jobs,
    refetchInterval: 2000,
  });
  const events = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: () => eventsApi.list({ limit: 8 }),
    refetchInterval: 4000,
  });
  const metrics = useQuery({
    queryKey: ['metrics'],
    queryFn: metricsApi.raw,
    refetchInterval: 10000,
  });

  const activeJobs =
    jobs.data?.filter((j) => j.status === 'started' || j.status === 'running') ??
    [];
  const requestTotal = parseRequestTotal(metrics.data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Application and infrastructure status for the Realworld Infrastructure Lab.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Application"
          loading={health.isLoading}
          value={
            <StatusDot
              ok={health.data?.status === 'ok'}
              label={health.data?.status?.toUpperCase() ?? '…'}
            />
          }
        />
        <StatCard
          title="Database"
          loading={health.isLoading}
          value={
            <StatusDot
              ok={health.data?.database.status === 'connected'}
              label={
                health.data?.database.status === 'connected'
                  ? `connected · ${health.data.database.latencyMs ?? '—'}ms`
                  : 'disconnected'
              }
            />
          }
        />
        <StatCard
          title="Hostname"
          loading={health.isLoading}
          value={
            <span className="font-mono text-sm">{health.data?.hostname ?? '—'}</span>
          }
        />
        <StatCard
          title="Uptime"
          loading={health.isLoading}
          value={formatUptime(health.data?.uptime ?? 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Runtime overview"
            description="Useful when comparing Docker, EC2, and Kubernetes replicas"
          />
          <CardBody>
            {system.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Node.js" value={system.data?.nodeVersion} />
                <InfoRow label="Platform" value={`${system.data?.platform} / ${system.data?.architecture}`} />
                <InfoRow
                  label="Memory (heap)"
                  value={`${formatBytes(system.data?.memory.heapUsed ?? 0)} / ${formatBytes(system.data?.memory.heapTotal ?? 0)}`}
                />
                <InfoRow
                  label="RSS"
                  value={formatBytes(system.data?.memory.rss ?? 0)}
                />
                <InfoRow
                  label="CPU cores"
                  value={String(system.data?.cpu.cores ?? '—')}
                />
                <InfoRow
                  label="Load average"
                  value={(system.data?.cpu.loadAverage ?? [])
                    .map((n) => n.toFixed(2))
                    .join(' · ') || 'n/a'}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Request statistics" description="From /api/metrics" />
          <CardBody className="space-y-4">
            <div>
              <div className="text-xs text-slate-400">HTTP requests total</div>
              <div className="mt-1 font-mono text-3xl font-semibold text-accent">
                {requestTotal}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Active load jobs</div>
              <div className="mt-1 text-2xl font-semibold">{activeJobs.length}</div>
            </div>
            <Badge tone="info">Prometheus scrape: /api/metrics</Badge>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Active jobs" description="CPU / DB / HTTP load" />
          <CardBody>
            {activeJobs.length === 0 ? (
              <p className="text-sm text-slate-400">No active load jobs.</p>
            ) : (
              <ul className="space-y-2">
                {activeJobs.map((job) => (
                  <li
                    key={job.jobId}
                    className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-slate-300">
                      {job.type.toUpperCase()}
                    </span>
                    <Badge tone="warning">{job.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent events" description="Newest first" />
          <CardBody>
            {events.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ul className="space-y-2 font-mono text-xs">
                {(events.data?.items ?? []).map((event) => (
                  <li key={event.id} className="flex gap-3 text-slate-300">
                    <span className="shrink-0 text-slate-500">
                      [{formatTime(event.createdAt)}]
                    </span>
                    <span className="text-accent">{event.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
        <div className="mt-2 text-lg font-medium">
          {loading ? <Skeleton className="h-6 w-24" /> : value}
        </div>
      </CardBody>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm text-slate-100">{value || '—'}</div>
    </div>
  );
}
