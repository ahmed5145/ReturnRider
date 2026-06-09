# ReturnRider — Phase 3 Roadmap

> **Status:** IN PROGRESS — started 2026-06-09  
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

## Phase 3a — Polish & ship beta (in progress)

| ID | Item | Status |
|----|------|--------|
| P3a-01 | Money protected dashboard hero | ✅ Done |
| P3a-02 | Completed returns archive tab | ✅ Done |
| P3a-03 | Gmail connect trust screen | ✅ Done |
| P3a-05 | Marketing landing page (`apps/web`) | ✅ Done |
| P3a-06 | Merchant return portal deep links | ✅ Done |
| P3a-07 | Report misparsed / teach parser | ✅ Done |
| P3a-04 | Push (Android dev build) | ⏸ Next |
| UX-01 | Skeleton loaders | ⏸ Planned |
| UX-08 | Refund celebration polish | ⏸ Planned |

### API additions (3a)

- `GET /returns/stats` — at-risk $, refunded YTD, completed count
- `GET /returns/completed` — refund archive
- `POST /returns/:id/report-misparsed` — user feedback (`parse_feedback` table)
- `DELETE /returns/:id` — remove draft/completed
- `GET /` — marketing landing (from `apps/web/public`)

### Migration

```bash
# Apply on Neon
psql $DATABASE_URL -f db/migrations/004_parse_feedback.sql
cd apps/api && npx prisma generate
```

---

## Phase 3b — Magic features (after 3a beta)

| ID | Item | Depends on |
|----|------|------------|
| P3b-03 | Plaid refund radar | Plaid production keys |
| P3b-04 | EasyPost carrier tracking | EasyPost account |
| P3b-06 | Smart snooze suggestions | Analytics baseline |
| P3b-07 | Return label PDF vault | Email attachment parsing |
| P3b-01 | Google Wallet production | Google service account |
| P3b-01 | Apple Wallet production | **Apple Developer** |

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
