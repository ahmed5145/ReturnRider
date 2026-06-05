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
Legal: http://localhost:3000/legal/terms · http://localhost:3000/legal/privacy

### Mobile (no Docker)

Requires **Expo SDK 54** (matches current Expo Go). If you see an SDK mismatch, run `npx expo install --fix` in `apps/mobile`.

```bash
cd apps/mobile
cp .env.example .env
npm install
npx expo install --fix
npm start
```

Use your PC's LAN IP instead of `localhost` when testing on a physical device.

## Environment

See [.env.example](.env.example) for required secrets (Gmail OAuth, Plaid, EasyPost, wallet certs).
