# ReturnRider — Phase 3 Roadmap

> **Status:** Phase 3a–3b COMPLETE — smoke test pending. Phase 4 deferred.  
> **Authority:** Builds on [ROADMAP_PHASE2.md](./ROADMAP_PHASE2.md) (complete) and [PRODUCT_IDEAS.md](./PRODUCT_IDEAS.md).

---

## Deferred (requires Apple Developer $99)

| ID | Item | Blocker |
|----|------|---------|
| P3b-01 | Apple Wallet production passes | Apple certs + Developer account |
| P3b-02 | Live Activities / Dynamic Island | Apple Developer account |
| P3a-04 (iOS) | APNs push on physical iOS | Apple Developer account |
| P12-full | iOS dev build + TestFlight | Apple Developer account |

**Android push / dev build** can proceed without Apple — see [DEV_BUILD.md](./DEV_BUILD.md).

---

## Phase 3a — Polish & ship beta ✅ COMPLETE

> Push delivery requires Android dev build install (free). Code + test endpoint ready.

| ID | Item | Status |
|----|------|--------|
| P3a-01 | Money protected dashboard hero | ✅ Done |
| P3a-02 | Completed returns archive tab | ✅ Done |
| P3a-03 | Gmail connect trust screen | ✅ Done |
| P3a-05 | Marketing landing page (`apps/web`) | ✅ Done |
| P3a-06 | Merchant return portal deep links | ✅ Done |
| P3a-07 | Report misparsed / teach parser | ✅ Done |
| P3a-04 | Push (Android dev build) | ✅ Infra ready — build APK to test |
| UX-01 | Skeleton loaders | ✅ Done |
| UX-08 | Refund celebration + share | ✅ Done |
| P3b-06 | Smart snooze suggestions | ✅ Done |
| UX-09 | Merchant emoji on cards | ✅ Done |

### API additions (3a)

- `GET /returns/stats` — at-risk $, refunded YTD, completed count
- `GET /returns/completed` — refund archive
- `POST /returns/:id/report-misparsed` — user feedback (`parse_feedback` table)
- `DELETE /returns/:id` — remove draft/completed
- `GET /` — marketing landing (from `apps/web/public`)
- `POST /users/test-push` — verify push on dev build
- `POST /returns/:id/snooze` — optional `{ mode: "24h" | "weekend" }`

### Migration

```bash
# Apply on Neon
psql $DATABASE_URL -f db/migrations/004_parse_feedback.sql
cd apps/api && npx prisma generate
```

---

## Phase 3b — Magic features ✅ COMPLETE (no Apple account)

| ID | Item | Status |
|----|------|--------|
| UX-05 | Bottom tab nav (Home · Add · Settings) | ✅ Done |
| P3b-04 | Tracking timeline + manual tracking # | ✅ Done |
| P3b-03 | Plaid refund radar (connect bank UI) | ✅ Done — needs dev build + Plaid env |
| MKT-06 | Invite friends share | ✅ Done |
| P3b-07 | Return label URL vault (from email) | ✅ Done |
| P3b-01 | Google Wallet production | ✅ Docs — [GOOGLE_WALLET_SETUP.md](./GOOGLE_WALLET_SETUP.md) |
| P3b-01 | Apple Wallet production | ⏸ **Apple Developer** |

---

## Phase 4 — Growth

See [PRODUCT_IDEAS.md](./PRODUCT_IDEAS.md) Tier 3 (MKT-01–07).

---

## Local verification

```bash
# API
cd apps/api && npm run dev
# Landing: http://localhost:3000/
# API: http://localhost:3000/api/v1

# Mobile
cd apps/mobile && npx expo start --go -c

# Web only (optional)
cd apps/web && npm start
# http://localhost:4321
```

---

## Implementation log

| Date | Item |
|------|------|
| 2026-06-09 | Phase 3a core: stats, archive, trust screen, landing, merchant links, parser feedback |
| 2026-06-09 | Smoke fixes: snooze, manual returns, nav, delete return |
| 2026-06-09 | Push test API, deep links, skeleton, celebration, smart snooze, settings notifications |
| 2026-06-09 | Phase 3b: tabs, tracking API/UI, Plaid connect, invite share |
| 2026-06-09 | Expo owner ahmed5145, EAS docs, return label URL, Google Wallet docs |

### Migration 005

```bash
psql $DATABASE_URL -f db/migrations/005_return_label_url.sql
cd apps/api && npx prisma generate
```
