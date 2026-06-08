# ReturnRider — Phase 2 Roadmap (LOCKED)

> **Status:** LOCKED — 2026-06-08  
> **Authority:** This document supersedes ad-hoc Phase 2 planning. Do not change scope without updating this file and `docs/BLUEPRINT.md` Section J.  
> **Prerequisite:** P0–P7 complete (onboarding, Gmail OAuth, manual add, scan, multi-email, push wiring).  
> **North star:** User connects Gmail once → sees real returns with deadlines → gets reminded → ships with Wallet QR → confirms refund.

---

## KPIs (90-day targets)

| Metric | Target |
|--------|--------|
| Gmail connected within 24h | ≥ 65% |
| Gmail → first visible item (return or review) | < 10 min median |
| D30 retention | ≥ 35% |
| Avg refund $ saved/user/month | ≥ $45 |
| Parser precision (top-20 merchants) | ≥ 92% |
| API uptime (staging+) | ≥ 99.5% |

---

## Guiding principles

| Lens | Rule |
|------|------|
| User value | Missed parse > wrong deadline; never block users without email |
| Conversion | First session must show *something* valuable (return or “N need review”) |
| Retention | Push + deadline urgency + “money saved” feedback |
| Technical | Thin vertical slices; API truth in `openapi.yaml` + `BLUEPRINT.md` |
| Marketing | Privacy-first, shopping-mail-only, “boarding pass for returns” |

---

## Architecture (target)

```
Gmail → BullMQ sync → Parsers → (≥0.85) Dashboard
                            → (<0.85) Parse Review Queue → User confirm → Dashboard
Manual / Scan ─────────────────────────────────────────────→ Dashboard
Dashboard → Return Detail → Wallet / Snooze / Refund confirm
```

---

## Sprint plan

| Sprint | ID | Focus | Ship criteria |
|--------|-----|-------|---------------|
| **S1** | P8 | Email pipeline + review API | Sync stats, re-sync, incremental job, parse-review CRUD |
| **S2** | P8m | Review + sync mobile UI | User sees outcome <10 min after Gmail connect |
| **S3** | P9 + P10 | Dashboard, detail, settings | Theme, snooze/refund, sync now |
| **S4** | P11 + P9b | Staging deploy + onboarding polish | Public API URL; funnel events |
| **S5+** | P12–P14 | Push (Android), wallet, integrations | Deferred until core loop proven |

**Current sprint:** S3 (dashboard detail + settings polish)

---

## P8 — Email → returns pipeline

### API (S1)

- [x] `POST /emails/:id/sync` — manual re-sync
- [x] `GET /emails` — enrich with `last_sync_*`, `review_pending_count`, `returns_from_inbox_count`, `last_error`
- [x] BullMQ repeatable job — incremental sync every 15 min
- [x] `GET /parse-review` — list pending items for user
- [x] `POST /parse-review/:id/confirm` — user confirms → create return
- [x] `POST /parse-review/:id/dismiss` — not a return
- [x] `GET /users/me` — include `review_pending_count`

### Mobile (S2)

- [x] Dashboard sync status chip + pull-to-refresh
- [x] Banner: “N receipts need a quick look” → review list
- [x] Parse review list + confirm/dismiss
- [x] Settings: Sync now + last sync / error
- [x] Empty states: syncing / nothing found / items in review

### UX copy (locked)

- Review banner: “We found shopping emails — confirm {n} that need your eyes”
- Empty (syncing): “Scanning your last 90 days of shopping mail…”
- Empty (done, nothing): “No return receipts found yet. Try manual add or scan.”
- Privacy footer on connect: “Read-only · shopping mail only · disconnect anytime”

### Conversion

- Checklist step 2 completes when `returns_count > 0` OR `review_pending_count > 0`
- Post-Gmail toast: “Connected · scanning last 90 days…”

---

## P9 — Dashboard & return detail

### API

- Already exists: `GET /returns/active`, `POST /returns/:id/snooze`, refund confirm

### Mobile (S3)

- [ ] Apply `lib/theme.ts` to home, settings, add-return, detail
- [ ] Return cards: refund $, urgency colors, days-left pill
- [ ] Return detail: snooze, confirm refund, wallet CTAs
- [ ] Status filter chips on dashboard
- [ ] Header: “$X in refunds to protect”

---

## P9b — Onboarding polish (S4)

- [ ] Activation events (analytics-ready hooks)
- [ ] First-return celebration modal
- [ ] Smarter checklist completion rules

---

## P10 — Settings & trust (S3)

- [ ] Privacy section + legal links
- [ ] Per-inbox sync status (uses P8 API)

---

## P11 — Staging deploy (S4)

- [ ] API on Render/Fly/Railway
- [ ] Neon + Upstash env on host
- [ ] `EXPO_PUBLIC_API_URL` → staging URL
- [ ] CORS + `0.0.0.0` listen

---

## P12 — Notifications (S5, partial blockers)

- **Expo Go:** in-app deadline banners only
- **Android dev build:** real Expo push (free)
- **iOS:** requires Apple Developer $99/yr

---

## P13 — Wallet production (S5+)

- Apple pkpass + Google Wallet signing (`wallet-certs/`)
- Defer until P8–P9 proven with real users

---

## P14 — Deferred integrations

| Integration | Trigger to start |
|-------------|------------------|
| EasyPost | Returns regularly reach `ready_to_ship` |
| Plaid | Manual refund confirm flow stable |
| Go email-worker | API sync bottlenecks |
| Forward-in email | Growth phase |

---

## Success metrics by workstream

| Workstream | Metric | Target |
|------------|--------|--------|
| P8 | Gmail → first visible item | < 10 min median |
| P8 | Auto-parse precision (top merchants) | ≥ 92% |
| P9 | D1 dashboard revisit | ≥ 40% |
| P9b | Gmail connect within 24h | ≥ 65% |
| P10 | Disconnect after sync | < 10% |
| P11 | API uptime | ≥ 99.5% |
| P12 | Push opt-in (dev build) | ≥ 50% |
| P13 | Wallet add on ready_to_ship | ≥ 30% |

---

## Implementation log

| Date | Sprint | Change |
|------|--------|--------|
| 2026-06-08 | — | Phase 2 roadmap locked |
| 2026-06-08 | S1 | Sync stats, re-sync, parse-review API, incremental sync, mobile S2 screens |

---

## References

- [BLUEPRINT.md](./BLUEPRINT.md) — architecture & P0–P7
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- [DEV_BUILD.md](./DEV_BUILD.md)
- [openapi.yaml](./openapi.yaml)
