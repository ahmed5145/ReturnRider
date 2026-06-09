# ReturnRider — Phase 4 Roadmap

> **Status:** Phase 4b in progress.  
> **Authority:** [PRODUCT_IDEAS.md](./PRODUCT_IDEAS.md) Tier 3–5 · builds on [ROADMAP_PHASE3.md](./ROADMAP_PHASE3.md).

---

## Phase 4a — Trust & compliance ✅

| ID | Item | Status |
|----|------|--------|
| TRUST-02 | Data export | ✅ |
| TRUST-03 | Account deletion | ✅ |
| TRUST-04 | Parser confidence explainability | ✅ |
| MKT-05 | Privacy comparison on landing | ✅ |
| TRUST-05 | Staging on Render | ✅ |

---

## Phase 4b — Growth ✅ (first slice)

| ID | Item | Status |
|----|------|--------|
| MKT-06 | Referral program | ✅ Code, share link, 180d sync reward for referrer |
| MKT-02 | Seasonal campaign banner | ✅ Dashboard (holiday + summer) |
| MKT-01 | Refund share card | ✅ Rich multi-line share text + YTD |
| MKT-07 | Press kit | ✅ [PRESS_KIT.md](./PRESS_KIT.md) |
| UX-02 | Haptic on urgent deadlines | ✅ Detail screen ≤3 days |
| MKT-04 | ASO / Play listing | 📋 Doc when store accounts ready |

### API

- `POST /api/v1/users/referral/apply` — body `{ "code": "A1B2C3D4" }`
- `GET /api/v1/users/me` — adds `referral_code`, `referrals_count`, `referred_by_applied`

### Migration

```bash
psql $DATABASE_URL -f db/migrations/006_referral.sql
cd apps/api && npx prisma generate
```

### Mobile

- Settings → referral link, share, apply friend’s code
- Dashboard → seasonal campaign banner
- Refund celebration → formatted share card
- Return detail → haptic when ≤3 days left

---

## Phase 4c — UX polish (backlog)

| ID | Item |
|----|------|
| UX-04 | Swipe snooze on dashboard cards |
| UX-06 | Theme toggle |
| UX-10 | Accessible font scaling |

---

## Phase 4d — Production readiness

| ID | Item | Blocker |
|----|------|---------|
| TRUST-01 | Google OAuth verification | Google Cloud process |
| P3b-01 | Google Wallet production | Google issuer setup |
| Apple Wallet + iOS push | Apple Developer $99 |
| Plaid production | Render env + dev APK |
| EasyPost webhooks | `EASYPOST_*` env |

---

## Implementation log

| Date | Item |
|------|------|
| 2026-06-09 | Phase 4a: trust + compliance |
| 2026-06-09 | Phase 4b: referral, campaigns, share card, haptics, press kit |
| 2026-06-09 | Smoke fixes: snooze list, nav, legal, Plaid errors, merchant fallback |
