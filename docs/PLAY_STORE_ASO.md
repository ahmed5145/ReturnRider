# Play Store listing & ASO (MKT-04)

Draft copy for Google Play when you have a **$25 Play Console** account. iOS App Store copy can mirror this after Apple Developer enrollment.

---

## App identity

| Field | Draft |
|-------|--------|
| **App name** | ReturnRider — Return & Refund Tracker |
| **Package** | `com.returnrider.app` (match `app.config.js`) |
| **Category** | Finance → Personal finance |
| **Content rating** | Everyone (no mature content) |
| **Contact email** | Your support address (same as OAuth consent screen) |

---

## Short description (80 chars)

```
Never miss a return deadline. Track refunds from Gmail and get reminders.
```

---

## Full description

```
ReturnRider automatically finds return deadlines and refund status from your shopping emails — so you stop losing money on forgotten returns.

WHAT YOU GET
• Dashboard of active returns with days left and dollars at risk
• Reminders before ship-by dates (push on Android dev builds)
• Refund celebration when money comes back
• Manual returns when email sync misses something
• Export your data or delete your account anytime

PRIVACY FIRST
• Read-only Gmail — shopping mail only, never send or delete
• Disconnect any inbox in one tap
• We never sell your email data

OPTIONAL
• Link a bank (Plaid) to detect when refunds hit your account
• Share invite links — friends get protected, you get extended sync

Perfect for online shoppers who stack return windows across Amazon, Target, and every other retailer.

Questions? See our Privacy Policy and Terms in the app Settings.
```

---

## Keywords / ASO tips

Focus on intent, not competitor names in the **title** (Play policy):

- return deadline tracker
- refund tracker
- package return reminder
- shopping return helper
- gmail order tracker (describe in long text, not misleading claims)

**Screenshots (phone):** 6–8 frames suggested order:

1. Money hero — “$X at risk”
2. Return list with urgency colors
3. Return detail — snooze + merchant link
4. Connect Gmail trust screen
5. Settings — privacy + export/delete
6. Refund celebration share card

Use dark theme screenshots; add one light theme after UX-06 ships.

**Feature graphic:** 1024×500 — logo + “Don’t lose your refund.”

---

## Data safety form (Play Console)

Align answers with app behavior:

| Question | Answer |
|----------|--------|
| Collects email? | Yes — for Gmail OAuth linked address |
| Encrypted in transit? | Yes (HTTPS) |
| Users can request deletion? | Yes — in-app delete account |
| Data shared with third parties? | No sale; processors: Google (Gmail API), Plaid if user opts in |

Link privacy policy URL: `https://returnrider-api.onrender.com/legal/privacy`

---

## Release track strategy

1. **Internal testing** — APK from EAS to your Google account
2. **Closed testing** — 10–20 friends, gather crash-free sessions
3. **Open testing** — optional beta badge
4. **Production** — after OAuth verification + stable push (FCM)

---

## Checklist before submit

- [ ] `versionCode` bumped in `app.config.js`
- [ ] Signed AAB from EAS production profile
- [ ] Privacy policy + terms URLs live
- [ ] OAuth consent screen in Testing with testers OR verified for production
- [ ] Plaid optional — app works without bank link
- [ ] No `ALLOW_DEV_AUTH=true` on production API
