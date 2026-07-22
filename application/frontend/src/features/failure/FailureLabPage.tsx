import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { failureApi } from '@/services/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';

export function FailureLabPage() {
  const queryClient = useQueryClient();
  const [delayMs, setDelayMs] = useState(2000);
  const [errorRate, setErrorRate] = useState({
    percentage: 25,
    durationSeconds: 60,
  });
  const [dbDuration, setDbDuration] = useState(60);

  const status = useQuery({
    queryKey: ['failure-status'],
    queryFn: failureApi.status,
    refetchInterval: 2000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['failure-status'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['health'] });
  };

  const slowMutation = useMutation({
    mutationFn: (ms: number) => failureApi.setSlow(ms),
    onSuccess: () => {
      toast.success('Slow response setting updated');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const errorMutation = useMutation({
    mutationFn: () =>
      failureApi.setErrorRate(errorRate.percentage, errorRate.durationSeconds),
    onSuccess: () => {
      toast.success('Error rate simulation updated');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dbMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      failureApi.setDatabaseUnavailable(enabled, enabled ? dbDuration : undefined),
    onSuccess: () => {
      toast.success('Database failure simulation updated');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Failure Lab</h1>
        <p className="mt-1 text-sm text-slate-400">
          Safely simulate latency, error rates, and database unavailability. No destructive operations.
        </p>
      </div>

      {status.data?.anyActive ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Failure simulation is active</div>
            <div className="mt-1 text-warning/90">
              Responses may be delayed, fail randomly, or report database issues until simulations are cleared.
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-400">Slow responses</div>
            <div className="mt-2">
              <Badge tone={status.data?.slow.active ? 'warning' : 'neutral'}>
                {status.data?.slow.active
                  ? `${status.data.slow.delayMs}ms delay`
                  : 'inactive'}
              </Badge>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-400">Error rate</div>
            <div className="mt-2">
              <Badge tone={status.data?.errorRate.active ? 'danger' : 'neutral'}>
                {status.data?.errorRate.active
                  ? `${status.data.errorRate.percentage}% · ${status.data.errorRate.remainingSeconds}s left`
                  : 'inactive'}
              </Badge>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-400">Database unavailable</div>
            <div className="mt-2">
              <Badge
                tone={
                  status.data?.databaseUnavailable.active ? 'danger' : 'neutral'
                }
              >
                {status.data?.databaseUnavailable.active ? 'active' : 'inactive'}
              </Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Slow response" description="Max delay 30000ms" />
          <CardBody className="space-y-3">
            <div>
              <Label>Delay (ms)</Label>
              <Input
                type="number"
                min={0}
                max={30000}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => slowMutation.mutate(delayMs)}
              >
                Enable slow responses
              </Button>
              <Button
                variant="secondary"
                onClick={() => slowMutation.mutate(0)}
              >
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Controlled error rate"
            description="Temporary random 5xx injection"
          />
          <CardBody className="space-y-3">
            <div>
              <Label>Percentage</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={errorRate.percentage}
                onChange={(e) =>
                  setErrorRate((v) => ({
                    ...v,
                    percentage: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={errorRate.durationSeconds}
                onChange={(e) =>
                  setErrorRate((v) => ({
                    ...v,
                    durationSeconds: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => errorMutation.mutate()}>
                Enable error rate
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  failureApi
                    .setErrorRate(0, 1)
                    .then(() => {
                      toast.success('Error rate cleared');
                      invalidate();
                    })
                }
              >
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Database unavailable"
            description="Fails DB-backed requests gracefully"
          />
          <CardBody className="space-y-3">
            <div>
              <Label>Duration (seconds, optional auto-clear)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={dbDuration}
                onChange={(e) => setDbDuration(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => dbMutation.mutate(true)}
              >
                Simulate DB down
              </Button>
              <Button
                variant="secondary"
                onClick={() => dbMutation.mutate(false)}
              >
                Restore
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
