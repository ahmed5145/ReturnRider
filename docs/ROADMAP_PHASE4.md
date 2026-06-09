# ReturnRider — Phase 4 Roadmap

> **Status:** In progress (trust & compliance first).  
> **Authority:** [PRODUCT_IDEAS.md](./PRODUCT_IDEAS.md) Tier 3–5 · builds on [ROADMAP_PHASE3.md](./ROADMAP_PHASE3.md).

---

## Testing without an Android phone

| Feature | Expo Go (iPhone/Android) | Dev APK | Notes |
|---------|--------------------------|---------|-------|
| Dashboard, Gmail, returns | ✓ | ✓ | Primary smoke path |
| Parse review, manual add | ✓ | ✓ | |
| Staging API | ✓ | ✓ | `EXPO_PUBLIC_API_URL` on Render |
| Push notifications | ✗ | ✓ (Android) / ✗ (iOS without Apple $99) | Optional: Android emulator |
| Plaid bank link | ✗ | ✓ | Native SDK |
| Apple Wallet | ✗ | ✗ | Needs Apple Developer |

**Smoke test plan:** Use **Expo Go on any phone** (or iOS Simulator with Expo Go if available). Queue the Android dev APK for future push testing or install on a friend’s device.

---

## Phase 4a — Trust & compliance ✅ (first slice)

| ID | Item | Status |
|----|------|--------|
| TRUST-02 | Data export (`GET /users/me/export`) | ✅ Done |
| TRUST-03 | Account deletion (`DELETE /users/me`) | ✅ Done |
| TRUST-04 | Parser confidence explainability | ✅ Done |
| MKT-05 | Privacy comparison on landing | ✅ Done (table on `/`) |
| TRUST-05 | Staging environment | ✅ Live on Render |

### API

- `GET /api/v1/users/me/export` — JSON export (profile, inboxes, returns, feedback)
- `DELETE /api/v1/users/me` — body `{ "confirm": "DELETE" }` soft-deletes account

### Mobile

- Settings → **Download my data** (share sheet JSON)
- Settings → **Delete account** (confirm → sign out)
- Parse review shows `confidence_reason` per item

---

## Phase 4b — Growth (next)

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| MKT-01 | Refund share card graphic | M | Enhance `RefundCelebration` with image |
| MKT-06 | Referral rewards | L | Referral code + extended sync window |
| MKT-02 | Q4 urgency campaign | S | Copy + in-app banner |
| MKT-04 | ASO / store listing | M | Play Console when ready |
| MKT-07 | Press kit | S | Doc + stats |

---

## Phase 4c — UX polish (backlog)

| ID | Item |
|----|------|
| UX-02 | Haptic on urgent deadlines |
| UX-04 | Swipe snooze on dashboard cards |
| UX-06 | Theme toggle |
| UX-10 | Accessible font scaling |

---

## Phase 4d — Production readiness

| ID | Item | Blocker |
|----|------|---------|
| TRUST-01 | Google OAuth verification | Google Cloud verification process |
| P3b-01 | Google Wallet production | Google Cloud + issuer setup |
| P3b-01/02 | Apple Wallet + iOS push | Apple Developer $99 |
| EasyPost | Production tracking webhooks | `EASYPOST_*` env |

---

## Implementation log

| Date | Item |
|------|------|
| 2026-06-09 | Phase 4a: data export, account delete, parser confidence, roadmap doc |
