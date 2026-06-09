# ReturnRider — Phase 4 Roadmap

> **Status:** Phase 4c complete · Phase 4d docs ready.  
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

## Phase 4b — Growth ✅

| ID | Item | Status |
|----|------|--------|
| MKT-06 | Referral program | ✅ Code, share link, 180d sync reward for referrer |
| MKT-02 | Seasonal campaign banner | ✅ Dashboard (holiday + summer) |
| MKT-01 | Refund share card | ✅ Rich multi-line share text + YTD |
| MKT-07 | Press kit | ✅ [PRESS_KIT.md](./PRESS_KIT.md) |
| UX-02 | Haptic on urgent deadlines | ✅ Detail screen ≤3 days |
| MKT-04 | ASO / Play listing | 📋 [PLAY_STORE_ASO.md](./PLAY_STORE_ASO.md) |

### API

- `POST /api/v1/users/referral/apply` — body `{ "code": "A1B2C3D4" }`
- `GET /api/v1/users/me` — adds `referral_code`, `referrals_count`, `referred_by_applied`

### Migration ✅

`006_referral.sql` applied on Neon.

---

## Phase 4c — UX polish ✅

| ID | Item | Status |
|----|------|--------|
| UX-04 | Swipe snooze on dashboard cards | ✅ `ReturnListCard` + 24h snooze |
| UX-06 | Theme toggle | ✅ Settings Dark/Light + `ThemeProvider` |
| UX-10 | Accessible font scaling | ✅ `allowFontScaling` on list cards |
| — | Deep link referral capture | ✅ `?ref=` via `pending-referral.ts` |
| UX-07 | Onboarding progress % | ✅ 4-step checklist + “% protected” |
| — | Plaid on Render | ✅ `features.plaid: true` on `/health` |

### Mobile

- `ThemeProvider` + `GestureHandlerRootView` in root layout
- Dashboard uses `ReturnListCard` (swipe right → snooze)
- Settings → Appearance (Dark / Light)
- Referral codes from deep links applied on dashboard load

---

## Phase 4d — Production readiness (docs)

| ID | Item | Doc / blocker |
|----|------|----------------|
| TRUST-01 | Google OAuth verification | [GOOGLE_OAUTH_VERIFICATION.md](./GOOGLE_OAUTH_VERIFICATION.md) |
| — | Plaid on Render | [PLAID_SETUP.md](./PLAID_SETUP.md) |
| MKT-04 | Play Store ASO | [PLAY_STORE_ASO.md](./PLAY_STORE_ASO.md) |
| P3b-01 | Google Wallet production | [GOOGLE_WALLET_SETUP.md](./GOOGLE_WALLET_SETUP.md) |
| — | Apple Wallet + iOS push | **Deferred** — Apple Developer $99 |
| — | Play / App Store accounts | **Deferred** — ASO doc ready when you enroll |
| — | EasyPost webhooks | `EASYPOST_*` env |

---

## Implementation log

| Date | Item |
|------|------|
| 2026-06-09 | Phase 4a: trust + compliance |
| 2026-06-09 | Phase 4b: referral, campaigns, share card, haptics, press kit |
| 2026-06-09 | Smoke fixes: snooze list, nav, legal, Plaid errors, merchant fallback |
| 2026-06-04 | Phase 4c: theme, swipe snooze, font scaling, referral deep links |
| 2026-06-04 | Phase 4d docs: OAuth verification, Plaid, Play ASO |

