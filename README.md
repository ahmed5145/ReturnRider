# ReturnRider

Automated Return & Refund Tracker — mobile-first B2C app.

## Monorepo structure

| Path | Description |
|------|-------------|
| `apps/api` | NestJS REST API (PostgreSQL, Redis, BullMQ) |
| `apps/mobile` | Expo React Native client |
| `services/email-worker` | Go email sync & parsing worker |
| `db/migrations` | PostgreSQL schema |
| `infra/terraform` | Staging infrastructure |
| `docs/` | Blueprint & OpenAPI |
| `legal/` | Terms of Service & Privacy Policy |

## Quick start

```bash
cp .env.example .env
docker compose up -d
cd apps/api && npm install && npx prisma generate && npx prisma db push && npm run dev
```

### Dev auth token

```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-token \
  -H "Content-Type: application/json" \
  -d "{\"sub\":\"dev-user\",\"email\":\"dev@returnrider.com\"}"
```

Seed demo data: `cd apps/api && npx ts-node src/seed/seed.ts`

API: http://localhost:3000  
Docs: http://localhost:3000/api/docs

## Environment

See [.env.example](.env.example) for required secrets (Gmail OAuth, Plaid, EasyPost, wallet certs).
