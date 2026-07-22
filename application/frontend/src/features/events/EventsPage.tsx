import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { eventsApi } from '@/services/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Label, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/utils';

export function EventsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  const events = useQuery({
    queryKey: ['events', page, type],
    queryFn: () =>
      eventsApi.list({
        page,
        limit: 25,
        type: type || undefined,
      }),
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="mt-1 text-sm text-slate-400">
          Application event stream for load tests, records, and failure simulations.
        </p>
      </div>

      <Card>
        <CardHeader title="Filter" />
        <CardBody className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <Label>Event type</Label>
            <Select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
            >
              <option value="">All types</option>
              <option value="RECORD_CREATED">RECORD_CREATED</option>
              <option value="RECORD_UPDATED">RECORD_UPDATED</option>
              <option value="CPU_LOAD_STARTED">CPU_LOAD_STARTED</option>
              <option value="CPU_LOAD_COMPLETED">CPU_LOAD_COMPLETED</option>
              <option value="DATABASE_LOAD_STARTED">DATABASE_LOAD_STARTED</option>
              <option value="DATABASE_LOAD_COMPLETED">DATABASE_LOAD_COMPLETED</option>
              <option value="SIMULATED_ERROR">SIMULATED_ERROR</option>
              <option value="HEALTH_CHECK_FAILURE">HEALTH_CHECK_FAILURE</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => events.refetch()}>
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Event feed"
          description={
            events.data
              ? `${events.data.meta.total} events · newest first`
              : 'Loading…'
          }
        />
        <CardBody>
          {events.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : events.isError ? (
            <p className="text-sm text-danger">{(events.error as Error).message}</p>
          ) : (events.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">No events yet.</p>
          ) : (
            <ul className="space-y-2 font-mono text-xs">
              {events.data?.items.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-surface-border bg-surface px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">
                      [{formatTime(event.createdAt)}]
                    </span>
                    <Badge tone="info">{event.type}</Badge>
                  </div>
                  <div className="mt-1 text-slate-300">{event.message}</div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-400">Page {page}</span>
        <Button
          variant="secondary"
          disabled={!events.data || page >= events.data.meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
