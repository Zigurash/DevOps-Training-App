export type RecordStatus = 'active' | 'completed' | 'archived';

export interface HealthResponse {
  status: string;
  timestamp: string;
  hostname: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs: number | null;
    error?: string;
  };
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  architecture: string;
  nodeVersion: string;
  processId: number;
  uptime: number;
  environment: string;
  version: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external?: number;
  };
  cpu: {
    cores: number;
    model: string;
    loadAverage: number[];
  };
}

export interface RecordItem {
  id: string;
  title: string;
  description: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AppEvent {
  id: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LoadJob {
  jobId: string;
  type: 'cpu' | 'database' | 'http';
  status: 'started' | 'running' | 'completed' | 'failed';
  durationSeconds?: number;
  workers?: number;
  operations?: number;
  concurrency?: number;
  requests?: number;
  endpoint?: string;
  startedAt: string;
  endedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
}

export interface FailureStatus {
  slow: { active: boolean; delayMs: number };
  errorRate: {
    active: boolean;
    percentage: number;
    expiresAt: string | null;
    remainingSeconds: number;
  };
  databaseUnavailable: {
    active: boolean;
    expiresAt: string | null;
  };
  anyActive: boolean;
}
