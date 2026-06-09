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
| `apps/web` | Marketing landing page (static) |
| `docs/` | Blueprint, Phase 3 roadmap & OpenAPI |
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
# API (from repo root — npm workspace)
cd ReturnRider
npm install

# Mobile (standalone — NOT a workspace; avoids Expo Go native module errors)
cd apps/mobile
copy .env.example .env
npm install
npx expo install --fix
npx expo start -c
```

**Ports:** `8081` = Expo app (Metro). `3000` = API only (not the mobile UI).

**Physical phone:** set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000/api/v1` in `apps/mobile/.env` (`ipconfig` → IPv4). Phone and PC must be on the same Wi‑Fi. Keep `npm run dev` running in `apps/api`.

## Environment

See [.env.example](.env.example) for required secrets (Gmail OAuth, Plaid, EasyPost, wallet certs).
