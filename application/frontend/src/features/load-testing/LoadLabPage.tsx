import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { loadApi } from '@/services/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Select } from '@/components/ui/Input';
import { formatTime } from '@/lib/utils';

const endpoints = [
  '/api/health',
  '/api/health/live',
  '/api/health/ready',
  '/api/system/info',
  '/api/records',
  '/api/events',
  '/api/metrics',
];

const statusTone = {
  started: 'warning',
  running: 'warning',
  completed: 'success',
  failed: 'danger',
} as const;

export function LoadLabPage() {
  const queryClient = useQueryClient();
  const [cpu, setCpu] = useState({ durationSeconds: 5, workers: 1 });
  const [db, setDb] = useState({ operations: 200, concurrency: 5 });
  const [http, setHttp] = useState({
    requests: 50,
    concurrency: 5,
    endpoint: '/api/health',
  });

  const jobs = useQuery({
    queryKey: ['load-jobs'],
    queryFn: loadApi.jobs,
    refetchInterval: 1500,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['load-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  };

  const cpuMutation = useMutation({
    mutationFn: () => loadApi.startCpu(cpu),
    onSuccess: (res) => {
      toast.success(`CPU load started (${res.jobId.slice(0, 8)}…)`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dbMutation = useMutation({
    mutationFn: () => loadApi.startDatabase(db),
    onSuccess: (res) => {
      toast.success(`Database load started (${res.jobId.slice(0, 8)}…)`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const httpMutation = useMutation({
    mutationFn: () => loadApi.startHttp(http),
    onSuccess: (res) => {
      toast.success(`HTTP traffic started (${res.jobId.slice(0, 8)}…)`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const active =
    jobs.data?.filter((j) => j.status === 'started' || j.status === 'running') ??
    [];
  const history = jobs.data?.filter(
    (j) => j.status === 'completed' || j.status === 'failed',
  ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Load Lab</h1>
        <p className="mt-1 text-sm text-slate-400">
          Generate controlled CPU, database, and HTTP load with hard safety limits.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="CPU load"
            description="Max 60s · max 4 workers"
          />
          <CardBody className="space-y-3">
            <div>
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={cpu.durationSeconds}
                onChange={(e) =>
                  setCpu((v) => ({
                    ...v,
                    durationSeconds: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Workers</Label>
              <Input
                type="number"
                min={1}
                max={4}
                value={cpu.workers}
                onChange={(e) =>
                  setCpu((v) => ({ ...v, workers: Number(e.target.value) }))
                }
              />
            </div>
            <Button
              className="w-full"
              disabled={cpuMutation.isPending}
              onClick={() => cpuMutation.mutate()}
            >
              Start CPU Load
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Database load"
            description="Max 5000 ops · max concurrency 20"
          />
          <CardBody className="space-y-3">
            <div>
              <Label>Operations</Label>
              <Input
                type="number"
                min={1}
                max={5000}
                value={db.operations}
                onChange={(e) =>
                  setDb((v) => ({ ...v, operations: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label>Concurrency</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={db.concurrency}
                onChange={(e) =>
                  setDb((v) => ({ ...v, concurrency: Number(e.target.value) }))
                }
              />
            </div>
            <Button
              className="w-full"
              disabled={dbMutation.isPending}
              onClick={() => dbMutation.mutate()}
            >
              Start Database Load
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="HTTP traffic"
            description="Whitelisted internal endpoints only"
          />
          <CardBody className="space-y-3">
            <div>
              <Label>Requests</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={http.requests}
                onChange={(e) =>
                  setHttp((v) => ({ ...v, requests: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label>Concurrency</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={http.concurrency}
                onChange={(e) =>
                  setHttp((v) => ({
                    ...v,
                    concurrency: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Endpoint</Label>
              <Select
                value={http.endpoint}
                onChange={(e) =>
                  setHttp((v) => ({ ...v, endpoint: e.target.value }))
                }
              >
                {endpoints.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={httpMutation.isPending}
              onClick={() => httpMutation.mutate()}
            >
              Generate Traffic
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Active jobs" description={`${active.length} running`} />
          <CardBody>
            {active.length === 0 ? (
              <p className="text-sm text-slate-400">No active jobs.</p>
            ) : (
              <JobList jobs={active} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Completed / failed"
            description={`${history.length} recent`}
          />
          <CardBody>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">No completed jobs yet.</p>
            ) : (
              <JobList jobs={history.slice(0, 12)} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function JobList({
  jobs,
}: {
  jobs: Array<{
    jobId: string;
    type: string;
    status: keyof typeof statusTone;
    startedAt: string;
    endedAt?: string;
    durationSeconds?: number;
    operations?: number;
    requests?: number;
    error?: string;
  }>;
}) {
  return (
    <ul className="space-y-2">
      {jobs.map((job) => (
        <li
          key={job.jobId}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-xs uppercase text-slate-300">
              {job.type}
            </div>
            <Badge tone={statusTone[job.status]}>{job.status}</Badge>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            start {formatTime(job.startedAt)}
            {job.endedAt ? ` · end ${formatTime(job.endedAt)}` : ''}
            {job.durationSeconds ? ` · ${job.durationSeconds}s` : ''}
            {job.operations ? ` · ${job.operations} ops` : ''}
            {job.requests ? ` · ${job.requests} req` : ''}
          </div>
          {job.error ? (
            <div className="mt-1 text-xs text-danger">{job.error}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
