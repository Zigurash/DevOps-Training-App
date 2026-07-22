import { api } from '@/lib/api';
import type {
  AppEvent,
  FailureStatus,
  HealthResponse,
  LoadJob,
  Paginated,
  RecordItem,
  RecordStatus,
  SystemInfo,
} from '@/types';

export const healthApi = {
  check: () => api.get<HealthResponse>('/api/health'),
  live: () => api.get<{ status: string }>('/api/health/live'),
  ready: () => api.get<{ status: string }>('/api/health/ready'),
};

export const systemApi = {
  info: () => api.get<SystemInfo>('/api/system/info'),
};

export const recordsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    return api.get<Paginated<RecordItem>>(`/api/records?${qs.toString()}`);
  },
  create: (data: {
    title: string;
    description?: string;
    status?: RecordStatus;
  }) => api.post<RecordItem>('/api/records', data),
  update: (
    id: string,
    data: { title?: string; description?: string; status?: RecordStatus },
  ) => api.patch<RecordItem>(`/api/records/${id}`, data),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/api/records/${id}`),
};

export const eventsApi = {
  list: (params?: { page?: number; limit?: number; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.type) qs.set('type', params.type);
    return api.get<Paginated<AppEvent>>(`/api/events?${qs.toString()}`);
  },
};

export const loadApi = {
  startCpu: (data: { durationSeconds: number; workers: number }) =>
    api.post<LoadJob>('/api/load/cpu', data),
  startDatabase: (data: { operations: number; concurrency: number }) =>
    api.post<LoadJob>('/api/load/database', data),
  startHttp: (data: {
    requests: number;
    concurrency: number;
    endpoint: string;
  }) => api.post<LoadJob>('/api/load/http', data),
  jobs: () => api.get<LoadJob[]>('/api/load/jobs'),
  job: (id: string) => api.get<LoadJob>(`/api/load/jobs/${id}`),
};

export const failureApi = {
  status: () => api.get<FailureStatus>('/api/failure/status'),
  setSlow: (delayMs: number) =>
    api.post<FailureStatus>('/api/failure/slow', { delayMs }),
  setErrorRate: (percentage: number, durationSeconds: number) =>
    api.post<FailureStatus>('/api/failure/error-rate', {
      percentage,
      durationSeconds,
    }),
  setDatabaseUnavailable: (enabled: boolean, durationSeconds?: number) =>
    api.post<FailureStatus>('/api/failure/database', {
      enabled,
      durationSeconds,
    }),
};

export const metricsApi = {
  raw: () => api.get<string>('/api/metrics'),
};
