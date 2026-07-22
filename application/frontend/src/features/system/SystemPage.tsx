import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/services/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatBytes, formatUptime } from '@/lib/utils';

export function SystemPage() {
  const system = useQuery({
    queryKey: ['system'],
    queryFn: systemApi.info,
    refetchInterval: 3000,
  });

  const rows = system.data
    ? [
        ['Hostname', system.data.hostname],
        ['Platform / OS', system.data.platform],
        ['Architecture', system.data.architecture],
        ['Node.js version', system.data.nodeVersion],
        ['Process ID', String(system.data.processId)],
        ['Uptime', formatUptime(system.data.uptime)],
        ['Environment', system.data.environment],
        ['Application version', system.data.version],
        ['CPU cores', String(system.data.cpu.cores)],
        ['CPU model', system.data.cpu.model],
        [
          'Load average',
          system.data.cpu.loadAverage.map((n) => n.toFixed(2)).join(' / ') ||
            'n/a (Windows)',
        ],
        ['Memory RSS', formatBytes(system.data.memory.rss)],
        ['Heap used', formatBytes(system.data.memory.heapUsed)],
        ['Heap total', formatBytes(system.data.memory.heapTotal)],
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System</h1>
        <p className="mt-1 text-sm text-slate-400">
          Runtime identity for the current backend instance. Useful when comparing containers, EC2 hosts, and Kubernetes pods.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Backend instance"
          description="Values change across replicas and redeployments"
        />
        <CardBody>
          {system.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : system.isError ? (
            <p className="text-sm text-danger">
              {(system.error as Error).message}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-surface-border bg-surface px-3 py-2"
                >
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-1 break-all font-mono text-sm text-slate-100">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
