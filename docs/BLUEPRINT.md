# ReturnRider — Production Blueprint

Single source of truth for product decisions, architecture, gaps, and roadmap.

See also: [openapi.yaml](./openapi.yaml), [compliance/GOOGLE_OAUTH_COMPLIANCE.md](./compliance/GOOGLE_OAUTH_COMPLIANCE.md), [../db/migrations/](../db/migrations/), [../legal/](../legal/).

## Value proposition

ReturnRider reduces return-window anxiety and refund uncertainty by ingesting commerce-related email signals, computing return deadlines, vaulting QR codes in Apple/Google Wallet, tracking shipments, and detecting bank refunds—without selling email data.

---

## Repository map

| Component | Path | Stack |
|-----------|------|-------|
| Mobile | `apps/mobile` | Expo SDK 54, React Native 0.81, TypeScript |
| API | `apps/api` | NestJS 10, Prisma, BullMQ, PostgreSQL |
| Email worker | `services/email-worker` | Go 1.22, Redis |
| Database | `db/migrations` | PostgreSQL 16 |
| Infrastructure | `infra/terraform/staging` | AWS VPC, RDS, ElastiCache, S3 |
| Legal | `legal/` | ToS, Privacy Policy |
| Wallet certs | `wallet-certs/` | Apple pkpass + Google service account (production) |

### Local dev (no Docker)

```bash
# API (workspace) — Neon + Upstash in apps/api/.env
cd ReturnRider && npm install
cd apps/api && npx prisma db push && npm run dev

# Mobile (standalone — not npm workspace)
cd apps/mobile && npm install && npx expo install --fix
# Set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000/api/v1 for physical device
npx expo start -c
```

Ports: **8081** = Expo app · **3000** = API only

---

## Section A — How data enters the app

| Entry path | Decision | Status |
|------------|----------|--------|
| **Email ingest (primary)** | Auto-discover orders/returns from connected inboxes | Partial — needs Google OAuth keys in prod |
| **Manual add (backup)** | User enters store, order #, deadline, amount | Implemented — `POST /returns/manual` |
| **Receipt scan (backup v1.1)** | Camera → OCR/confirm → create return | Implemented — scan + confirm flow |
| **Forward-in email (future)** | Forward receipt to dedicated address | Not started |
| **Dev seed** | Demo ASOS return for local dev | `apps/api/src/seed/seed.ts` |

**Product rule:** Email is primary; manual add + scan ensure users are never blocked.

---

## Section B — Email access & privacy

**Technical fact:** `gmail.readonly` can read the full inbox at the API level.

**Product promise:**
- Read-only OAuth — no send, delete, or modify
- Server-side query: `newer_than:90d` (or 180d opt-in) + commerce keywords
- Commerce classifier discards non-retail mail before persistence
- Store extracted fields only by default — not full threads
- Never sold for ads ([legal/PRIVACY_POLICY.md](../legal/PRIVACY_POLICY.md))
- User controls: pause sync, disconnect, export/delete

**UX copy:** “We request read-only access, but only fetch and process shopping-related messages.”

---

## Section C — Parser strategy

| Confidence | Behavior |
|------------|----------|
| ≥ 0.85 | Auto-create order/return |
| < 0.85 | `parse_review_queue` (admin UI future) |
| No match | Ignore |
| User correction | “Fix this return” — future |

**Principle:** Missed parse > wrong deadline.

---

## Section D — Multiple email accounts

- DB: `linked_emails` per user
- API: connect multiple times; list + disconnect endpoints
- Mobile: Settings → Connected emails
- Dedup: `UNIQUE(user_id, merchant_name, external_order_id)`

---

## Section E — Historical sync window

| Setting | Value |
|---------|-------|
| Default backfill | **90 days** |
| Optional extended | **180 days** — toggle at connect |
| Before window | Manual add or scan only |
| Ongoing | Incremental sync (~15 min) |

---

## Section F — Notifications

**Primary:** Push (FCM → APNs on iOS). **Not email reminders in v1.**

| Trigger | Offset | Channel |
|---------|--------|---------|
| RET_T7 | T-7 days @ 09:00 local | Push + in-app |
| RET_T3 | T-3 days @ 09:00 local | Push + in-app |
| RET_T24H | T-24 hours @ 09:00 local | Push |
| RET_T6H | T-6 hours | Push high priority |
| RET_OVERDUE | T+1 day @ 10:00 | Push |

Future: weekly email digest, SMS opt-in for T-24H.

---

## Section G — Wallet (Apple / Google)

**Why:** Return QR in Wallet = one swipe at drop-off (like a boarding pass).

**One-time behavior:**
- **Gmail:** OAuth once; encrypted refresh token until revoke
- **Wallet pass:** Generated per return; not re-OAuth each time
- **Plaid:** Link once (optional) for refund detection

Production requires certs in `wallet-certs/` — see [wallet-certs/README.md](../wallet-certs/README.md).

---

## Section H — User education / onboarding

1. First-launch carousel (what we track / privacy / Wallet / deadlines)
2. Checklist: Account → Email → (optional) Bank → First return
3. Contextual tooltips on Wallet buttons
4. Empty states with actionable copy

---

## Section I — Cost matrix

| Service | Dev/hobby | Production |
|---------|-----------|------------|
| Neon Postgres | Free tier | Paid at scale |
| Upstash Redis | Free (256 MB) | Paid above limits |
| Google Gmail OAuth | Free | Verification effort |
| Firebase FCM | Free | Free |
| Apple Developer | — | **$99/year** |
| Google Play | — | **$25 one-time** |
| EasyPost | Sandbox free | Per usage |
| Plaid | Sandbox free | Per linked item |
| API hosting | Local free | AWS/Render/Fly |

---

## Section J — Phased roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| P0 | This blueprint | Done |
| P1 | Onboarding carousel + checklist | Done |
| P2 | Manual add return | Done |
| P3 | Gmail OAuth PKCE + auto-schedule notifications | Done |
| P3b | 180-day sync toggle | Done |
| P4 | Push FCM/APNs | Done |
| P5 | Multi-email settings | Done |
| P6 | Receipt scan + confirm | Done |
| P7 | Wallet production certs docs + signing path | Done |

---

## Section K — Gap summary

| Feature | Built? |
|---------|--------|
| Email primary ingest | Partial (needs prod OAuth keys) |
| 90d backfill | Yes |
| 180d optional | Yes |
| Multiple emails | Yes |
| Parse review queue | Backend only |
| Manual add return | Yes |
| Receipt scan | Yes |
| Push notifications | Yes (needs Firebase env) |
| Onboarding tutorial | Yes |
| Wallet production passes | Needs Apple/Google certs |

---

## Core APIs

- `POST /api/v1/emails/connect` — OAuth (optional `sync_days`: 90 | 180)
- `GET /api/v1/emails` — List linked accounts
- `DELETE /api/v1/emails/:id` — Disconnect
- `GET /api/v1/returns/active` — Upcoming deadlines
- `POST /api/v1/returns/manual` — Manual add (no email)
- `POST /api/v1/returns/parse-receipt-text` — Parse pasted/scanned text
- `POST /api/v1/returns/{id}/wallet-pass` — Wallet artifacts
- `POST /api/v1/users/push-token` — Register Expo push token
- `POST /api/v1/users/onboarding-complete` — Mark tutorial done
- `POST /api/v1/webhooks/tracking/easypost` — Carrier updates
- `POST /api/v1/plaid/link-token` — Refund detection (opt-in)

---

## Personas

- **Maya Chen** — Chronic online shopper; deadline reminders + wallet QR at drop-off.
- **Jordan Rivera** — Overwhelmed parent; low-friction setup + loud Q4 reminders.

---

## KPIs (90-day targets)

- Email connected within 24h: ≥65%
- D30 retention: ≥35%
- Avg refund $ saved/user/month: ≥$45
- Parser precision (top-20 merchants): ≥92%
