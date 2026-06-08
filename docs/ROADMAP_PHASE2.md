# ReturnRider — Phase 2 Roadmap (LOCKED)

> **Status:** LOCKED — 2026-06-08  
> **Phase 2 core:** **COMPLETE** (S1–S4). Smoke test before production.  
> **Deferred:** S5+ (push dev build, wallet certs, Plaid/EasyPost).  
> **Authority:** This document supersedes ad-hoc Phase 2 planning. Do not change scope without updating this file and `docs/BLUEPRINT.md` Section J.

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

## Sprint plan

| Sprint | ID | Status |
|--------|-----|--------|
| S1 | P8 API | ✅ Done |
| S2 | P8m Mobile review/sync | ✅ Done |
| S3 | P9 + P10 (partial) | ✅ Done |
| S4 | P11 + P9b + P10 + P12 (in-app) | ✅ Done |
| S5+ | P12 push / P13 wallet / P14 | ⏸ Deferred |

---

## P8 — Email → returns pipeline ✅

- [x] Sync stats, re-sync, incremental sync (15 min)
- [x] Parse review API + mobile UI
- [x] Dashboard sync states + checklist integration

---

## P9 — Dashboard & return detail ✅

- [x] Theme, filters, urgency, refund total
- [x] Return detail: snooze, refund confirm, wallet

---

## P9b — Onboarding polish ✅

- [x] `lib/analytics.ts` activation events
- [x] First-return celebration modal
- [x] Post-Gmail success banner on checklist
- [x] Checklist step 2: returns OR review pending

---

## P10 — Settings & trust ✅

- [x] Privacy section + Terms/Privacy links (API `/legal/*`)
- [x] Per-inbox sync now, stats, errors

---

## P11 — Staging deploy ✅ (config ready)

- [x] `render.yaml` blueprint
- [x] `docs/STAGING_DEPLOY.md`
- [x] `postinstall` prisma generate on API
- [x] Optional `CORS_ORIGINS` env
- [ ] **You deploy:** Render + set `EXPO_PUBLIC_API_URL` to staging URL

---

## P12 — Notifications (partial) ✅ in-app / ⏸ push

- [x] In-app next-deadline banner (≤7 days) on dashboard
- [x] Honest copy: push needs dev build, not Expo Go
- ⏸ Android dev build + real push
- ⏸ iOS push (Apple Developer $99)

---

## P13–P14 — Deferred

Wallet production certs, Plaid, EasyPost, Go email-worker.

---

## Implementation log

| Date | Sprint | Change |
|------|--------|--------|
| 2026-06-08 | — | Phase 2 roadmap locked |
| 2026-06-08 | S1 | Sync stats, re-sync, parse-review API, incremental sync |
| 2026-06-08 | S2 | Review + sync mobile UI |
| 2026-06-08 | S3 | Dashboard filters/urgency, return detail actions |
| 2026-06-08 | S4 | Analytics, celebration, privacy, staging deploy, deadline banner |

---

## Smoke test checklist (run once after restart)

See conversation / QA list:

1. Welcome carousel → checklist
2. Gmail connect → success banner → sync chip
3. Review queue confirm/dismiss
4. Dashboard filters + pull-to-refresh + celebration modal
5. Return detail snooze + refund confirm
6. Settings sync now + legal links open
7. Manual add + scan receipt
8. API health if staging deployed

---

## References

- [BLUEPRINT.md](./BLUEPRINT.md)
- [STAGING_DEPLOY.md](./STAGING_DEPLOY.md)
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- [DEV_BUILD.md](./DEV_BUILD.md)
