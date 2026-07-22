import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { recordsApi } from '@/services/api';
import type { RecordItem, RecordStatus } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Select, TextArea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const statusTone: Record<RecordStatus, 'success' | 'info' | 'neutral'> = {
  active: 'success',
  completed: 'info',
  archived: 'neutral',
};

export function RecordsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'active' as RecordStatus,
  });

  const records = useQuery({
    queryKey: ['records', page, search, status],
    queryFn: () =>
      recordsApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: recordsApi.create,
    onSuccess: () => {
      toast.success('Record created');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setCreating(false);
      setForm({ title: '', description: '', status: 'active' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) =>
      recordsApi.update(id, data),
    onSuccess: () => {
      toast.success('Record updated');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: recordsApi.remove,
    onSuccess: () => {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ title: '', description: '', status: 'active' });
  };

  const openEdit = (record: RecordItem) => {
    setEditing(record);
    setCreating(false);
    setForm({
      title: record.title,
      description: record.description || '',
      status: record.status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Records</h1>
          <p className="mt-1 text-sm text-slate-400">
            CRUD workload used for database and API exercises.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create record
        </Button>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <CardBody className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div>
            <Label>Search title</Label>
            <Input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setSearch(draftSearch);
                }
              }}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                setSearch(draftSearch);
              }}
            >
              Apply
            </Button>
          </div>
        </CardBody>
      </Card>

      {(creating || editing) && (
        <Card>
          <CardHeader
            title={editing ? 'Edit record' : 'Create record'}
            action={
              <Button
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
            }
          />
          <CardBody className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <TextArea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as RecordStatus,
                  }))
                }
              >
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="archived">archived</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                disabled={!form.title.trim()}
                onClick={() => {
                  if (editing) {
                    updateMutation.mutate({ id: editing.id, data: form });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
              >
                {editing ? 'Save changes' : 'Create'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Records table"
          description={
            records.data
              ? `${records.data.meta.total} total · page ${records.data.meta.page}/${records.data.meta.totalPages}`
              : 'Loading…'
          }
        />
        <CardBody className="overflow-x-auto p-0">
          {records.isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : records.isError ? (
            <div className="p-4 text-sm text-danger">
              {(records.error as Error).message}
            </div>
          ) : (records.data?.items.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No records found. Create one to get started.
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-surface-border text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.data?.items.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-surface-border/70 hover:bg-surface-overlay/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{record.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {record.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[record.status]}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {new Date(record.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => openEdit(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this record?')) {
                              deleteMutation.mutate(record.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          disabled={
            !records.data || page >= (records.data.meta.totalPages || 1)
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
