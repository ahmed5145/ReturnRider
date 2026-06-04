# ReturnRider Email Worker (Go)

High-concurrency Gmail sync worker. In hybrid deployments, the NestJS API enqueues `email-sync` jobs via BullMQ; this worker can process overflow or run standalone when pointed at the same Redis/Postgres.

## Build

```bash
cd services/email-worker
go build -o bin/email-worker .
```

## Run

```bash
export EMAIL_WORKER_REDIS_URL=redis://localhost:6379
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
./bin/email-worker
```
