# Realworld Infrastructure Lab

Interactive DevOps/SRE laboratory application for practicing infrastructure, networking, databases, monitoring, load testing, deployment, and scaling.

## Architecture

```text
Browser
  ↓
Nginx (public entrypoint)
  ↓
React Frontend
  ↓
NestJS Backend API
  ↓
PostgreSQL
```

The app is intentionally simple (no microservices, no Kafka/Redis/RabbitMQ) and designed to move from Docker Compose → EC2 → K3s/Kubernetes → Helm → Prometheus/Grafana → CI/CD with minimal application changes.

## Directory structure

```text
.
├── backend/          NestJS API + Prisma
├── frontend/         React + Vite UI
├── nginx/            Edge reverse proxy config
├── docker-compose.yml
└── .env.example
```

## Quick start (Docker Compose)

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build -d
```

3. Open the app:

```text
http://localhost:8080
```

Only Nginx is exposed. PostgreSQL and the backend stay on the internal Docker network.

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
```

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Backend

```bash
cd backend
cp ../.env.example .env
# adjust DATABASE_URL for local Postgres
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API listens on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the UI on `http://localhost:5173` and proxies `/api` to the backend.

### Root helpers

```bash
npm run install:all
npm run test
npm run build
```

## Database

Prisma schema:

- `records` — CRUD data for realistic DB load
- `application_events` — audit/event stream for lab actions

Migrations:

```bash
npm run db:migrate --prefix backend
npm run db:migrate:dev --prefix backend
npm run db:seed --prefix backend
```

## API endpoints

### Health (K8s-ready)

- `GET /api/health` — app + database check
- `GET /api/health/live` — liveness
- `GET /api/health/ready` — readiness

### System

- `GET /api/system/info` — hostname, PID, memory, CPU, version

### Records

- `GET /api/records`
- `GET /api/records/:id`
- `POST /api/records`
- `PATCH /api/records/:id`
- `DELETE /api/records/:id`

Supports pagination, sorting, status filter, and title search.

### Load Lab

- `POST /api/load/cpu` — controlled CPU burn (`durationSeconds` ≤ 60, `workers` ≤ 4)
- `POST /api/load/database` — insert/select/update/aggregate (`operations` ≤ 5000, `concurrency` ≤ 20)
- `POST /api/load/http` — traffic against a whitelist of internal endpoints
- `GET /api/load/jobs`
- `GET /api/load/jobs/:id`

### Failure Lab

- `POST /api/failure/slow` — inject latency
- `POST /api/failure/error-rate` — temporary error percentage
- `POST /api/failure/database` — graceful DB-unavailable mode
- `GET /api/failure/status`

### Events & metrics

- `GET /api/events`
- `GET /api/metrics` — Prometheus text format

## Frontend pages

- Dashboard — status, runtime, jobs, events, request totals
- Records — table CRUD with filters
- Load Lab — CPU / DB / HTTP load controls
- Failure Lab — slow / error-rate / DB-down simulations
- Events — newest-first event feed
- System — backend instance identity (useful across replicas)

## Configuration

See `.env.example`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://app:changeme@localhost:5432/realworld?schema=public
APP_VERSION=1.0.0
LOG_LEVEL=info
```

Do not commit real secrets.

## Logging

Backend emits structured JSON logs with timestamp, level, message, and metadata (no secrets).

## Testing

```bash
# Backend unit tests
npm run test --prefix backend

# Backend smoke e2e
npm run test:e2e --prefix backend

# Frontend unit tests
npm run test --prefix frontend
```

## Infrastructure evolution notes

The application does not assume:

- a fixed hostname
- a fixed IP
- a single replica
- Docker Compose forever

It is safe to place behind an ALB/Ingress, scale backend replicas, and scrape `/api/metrics` with Prometheus.

Recommended stages:

1. Local Docker Compose
2. EC2 + Ansible + Compose
3. Multi-node K3s
4. Helm
5. Prometheus + Grafana
6. CI/CD image build/push/deploy

## License

Educational / lab use.
