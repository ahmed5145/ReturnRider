# ReturnRider — Product Audit & Idea Backlog

> **Date:** 2026-06-09  
> **Scope:** Mobile app (primary surface), API/legal pages, onboarding, and future marketing site.  
> **Purpose:** Consolidated ideas for wow factor, differentiation, user value, marketing, and UI/UX — prioritized for post–Phase 2.

---

## Executive summary

ReturnRider’s core wedge is strong: **deadline anxiety → automated email ingest → wallet QR at drop-off → refund confirmation**. Phase 2 delivered the pipeline; the biggest gaps for “wow” are **visible money saved**, **trust at Gmail connect**, **push that actually fires**, and **polish on the happy path** (manual add, snooze, completed returns).

There is **no standalone marketing website yet** — only in-app legal links (`/legal/terms`, `/legal/privacy`). A lightweight landing page is a high-leverage marketing item.

---

## Current product audit (smoke-test lens)

| Area | What works | Gaps / friction |
|------|------------|-----------------|
| **Onboarding** | Welcome carousel, Gmail OAuth, checklist | “What happens next?” after connect could be clearer; no social proof |
| **Dashboard** | Filters, urgency colors, refund total, review banner | Completed returns disappear with no history; no “$ saved this month” hero |
| **Email sync** | 90d backfill, review queue, dismiss-all | False positives were high (fixed); users need confidence sync is *shopping-only* |
| **Return detail** | Scroll, snooze, wallet, refund confirm | Draft junk from bad parses; needs one-tap remove (shipped) |
| **Manual add** | Form works | Was saving as `draft` (fixed); should land on new return detail |
| **Settings** | Privacy copy, sync now, disconnect | Back nav was broken (fixed); header said “index” (fixed) |
| **Notifications** | Scheduler + BullMQ | Snooze hit DB unique constraint (fixed); push needs dev build |
| **Wallet** | API stub + in-app buttons | Production passes need Apple/Google certs |
| **Marketing site** | — | None — App Store listing will need web presence for OAuth + trust |

---

## Differentiation pillars

What competitors (Parcel, Slice, generic email apps) don’t do well:

1. **Return-window countdown as the hero metric** — not package tracking, not generic receipts.
2. **Wallet-native drop-off** — QR like a boarding pass (unique if executed well).
3. **Refund closure loop** — “Did the money hit?” closes the emotional loop.
4. **Privacy-first Gmail** — read-only, shopping-only, never sold (market aggressively).
5. **Missed parse > wrong deadline** — human review queue builds trust.

---

## Idea backlog (prioritized)

### Tier 1 — High impact, near-term (Phase 3a)

| ID | Idea | User value | Wow / marketing | Effort |
|----|------|------------|-----------------|--------|
| **P3a-01** | **“Money protected” dashboard hero** | See total $ at risk + $ refunded YTD | Shareable stat (“I saved $127 this quarter”) | S |
| **P3a-02** | **Completed returns archive** | History + proof of refunds | Retention + trust | S |
| **P3a-03** | **Gmail connect trust screen** | Animated “we only read shopping mail” + keyword list | Reduces OAuth drop-off | S |
| **P3a-04** | **Push notifications (dev build)** | T-7/T-3/T-24h reminders | Core promise delivered | M |
| **P3a-05** | **Marketing landing page** | SEO, OAuth verification, press link | `returnrider.com` with demo video + privacy | M |
| **P3a-06** | **Merchant return policy deep links** | “Start return on Amazon” opens correct portal | Saves 5+ min per return | M |
| **P3a-07** | **Fix / teach parser** | “Not a return?” on detail → improves model | Reduces false positives over time | M |

### Tier 2 — Differentiation & delight (Phase 3b)

| ID | Idea | User value | Wow / marketing | Effort |
|----|------|------------|-----------------|--------|
| **P3b-01** | **Apple / Google Wallet production passes** | One-tap QR at UPS/Target | App Store screenshots gold | L |
| **P3b-02** | **Live Activities / Dynamic Island (iOS)** | Countdown on lock screen | Premium feel, press-worthy | L |
| **P3b-03** | **Refund radar (Plaid)** | Auto-detect refund posted | “It just worked” magic | L |
| **P3b-04** | **Carrier tracking (EasyPost)** | In-transit status on timeline | Completes ship → refund story | L |
| **P3b-05** | **Household / family sharing** | Partner sees shared returns | Expands TAM | L |
| **P3b-06** | **Smart snooze suggestions** | “Busy this week? Snooze to Saturday” | Feels personal | M |
| **P3b-07** | **Return label PDF vault** | Store label attachment from email | Backup if Wallet fails | M |

### Tier 3 — Growth & marketing

| ID | Idea | Channel | Notes |
|----|------|---------|-------|
| **MKT-01** | **“Refund saved” share card** | Instagram / TikTok | Auto-generated graphic after confirm refund |
| **MKT-02** | **Q4 urgency campaign** | Paid + organic | “Holiday returns expire Jan 31” — seasonal hook |
| **MKT-03** | **Micro-influencer seeding** | YouTube “what I return” | Target deal/fashion creators |
| **MKT-04** | **App Store story** | ASO | Keywords: return deadline, refund tracker, Amazon return |
| **MKT-05** | **Privacy comparison page** | SEO | “ReturnRider vs reading your whole inbox” |
| **MKT-06** | **Referral: protect a friend’s refund** | In-app | Give 30d premium / extended sync window |
| **MKT-07** | **Press kit + founder story** | PR | “Americans lose $X billion in expired returns” stat |

### Tier 4 — UI/UX polish

| ID | Idea | Screen | Detail |
|----|------|--------|--------|
| **UX-01** | **Skeleton loaders** | Dashboard | Perceived speed during sync |
| **UX-02** | **Haptic on deadline urgency** | Detail | Tap feedback when &lt;3 days |
| **UX-03** | **Empty state illustrations** | Dashboard | Custom art vs plain text |
| **UX-04** | **Swipe actions on return cards** | Dashboard | Swipe to snooze / archive |
| **UX-05** | **Bottom tab nav** | Global | Home · Add · Settings (discoverability) |
| **UX-06** | **Dark/light theme toggle** | Settings | Accessibility |
| **UX-07** | **Onboarding progress %** | Checklist | “80% protected — connect bank?” |
| **UX-08** | **Celebration confetti** | Refund confirm | Dopamine on “I got my refund” |
| **UX-09** | **Merchant logos** | Cards | Amazon/Target icons via domain lookup |
| **UX-10** | **Accessible font scaling** | Global | Respect system text size |

### Tier 5 — Technical / trust / compliance

| ID | Idea | Why |
|----|------|-----|
| **TRUST-01** | Google OAuth verification + limited scope audit | Required for production Gmail |
| **TRUST-02** | Data export (GDPR/CCPA) | Settings → Download my data |
| **TRUST-03** | Account deletion flow | Settings → Delete account |
| **TRUST-04** | Parser confidence explainability | “75% match because…” on review screen |
| **TRUST-05** | Staging environment + TestFlight | Beta before public launch |

---

## Proposed Phase 3 roadmap (suggested)

```
Phase 3a (4–6 weeks) — Polish + ship beta
├── P3a-01 Money protected hero
├── P3a-02 Completed archive
├── P3a-03 Gmail trust screen
├── P3a-04 Push (Android dev build first)
├── P3a-05 Landing page
└── Bug bash from smoke tests

Phase 3b (6–8 weeks) — Magic features
├── P3b-01 Wallet production
├── P3b-03 Plaid refund radar
├── P3b-04 EasyPost tracking
└── P3b-02 Live Activities (iOS)

Phase 4 — Growth
├── MKT-01–07
├── Referral program
└── Top-20 merchant parser accuracy sprint
```

---

## Marketing site blueprint (when built)

**Single-page structure:**

1. **Hero** — “Never miss a return deadline again” + app mockup + App Store badges  
2. **How it works** — Connect Gmail → We find deadlines → Wallet QR → Refund confirmed  
3. **Privacy** — Read-only, shopping-only, never sold (link to full policy)  
4. **Social proof** — “$X protected for beta users” (once real)  
5. **FAQ** — Gmail scope, supported stores, pricing  
6. **Footer** — Terms, Privacy, Contact, Google OAuth compliance  

**Tech:** Static site on Vercel/Render (`apps/web` or `marketing/`) — no backend needed.

---

## Wow moments to engineer

| Moment | Trigger | Experience |
|--------|---------|------------|
| **First return appears** | After Gmail sync | Celebration modal (done) + optional confetti |
| **Deadline approaching** | T-3 push | “Your Nike return expires Friday — QR ready” |
| **At the store** | Wallet pass | Double-click home → QR scans |
| **Refund lands** | Plaid match | Push: “$49.99 refund from Target posted” |
| **Month in review** | Monthly | “You protected $312 in refunds this month” |

---

## Metrics to track (product)

| Metric | Target | Tool |
|--------|--------|------|
| Gmail connect rate (onboarding) | ≥65% | `analytics` events |
| Time to first visible return | &lt;10 min | `first_return_visible` |
| Review queue dismiss rate | Track junk vs confirm | API logs |
| Manual add completion | ≥80% of starts | `manual_return_added` |
| Snooze usage | Baseline | New event |
| Refund confirm rate | ≥50% of completed returns | `refund_confirmed` |
| D7 / D30 retention | ≥35% D30 | PostHog / Amplitude |

---

## Competitive positioning (one-liner options)

- **“Flight tracker for your refunds.”**
- **“The app that remembers return deadlines so you don’t have to.”**
- **“Connect Gmail once. Never lose a refund again.”**

---

## Out of scope (for now)

- B2B / retailer integrations  
- Automated return initiation (click bot on merchant sites)  
- Price-drop protection / Honey overlap  
- Full inbox client  

---

## Related docs

- [BLUEPRINT.md](./BLUEPRINT.md) — Architecture & phased delivery  
- [ROADMAP_PHASE2.md](./ROADMAP_PHASE2.md) — Locked Phase 2 (complete)  
- [STAGING_DEPLOY.md](./STAGING_DEPLOY.md) — Render deploy  
- [DEV_BUILD.md](./DEV_BUILD.md) — Expo dev client for push  

---

*Update this doc when ideas ship or priorities change. Link shipped items to PRs in the implementation log below.*

### Implementation log

| Date | Item | Notes |
|------|------|-------|
| 2026-06-09 | Smoke fixes | Snooze upsert, manual→ready_to_ship, delete return, nav labels |
| 2026-06-09 | P3a-01–07 | Stats hero, completed tab, trust screen, landing page, merchant links, parser feedback |
| 2026-06-09 | P3a-04, UX-01/08/09, P3b-06 | Push test API, skeleton, celebration+share, smart snooze, merchant emoji |
| 2026-06-09 | TRUST-02/03/04, MKT-05 | Data export, delete account, parser confidence, privacy table on landing |
| 2026-06-09 | MKT-01/02/06/07, UX-02 | Referral program, campaign banner, refund share card, haptics, press kit |
| — | P3a-04 Android push | APK via EAS — emulator or friend's phone if no Android device |
| — | P3b-01/02 Apple | Deferred — no Apple Developer account |
