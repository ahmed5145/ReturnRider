# Google OAuth verification (TRUST-01)

ReturnRider requests **restricted** Gmail scope (`gmail.readonly`). While the OAuth consent screen is in **Testing**, only listed test users can connect. To ship to real users you must complete **Google OAuth verification**.

See also: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for initial client + consent screen setup.

---

## When you need this

| Consent screen status | Who can sign in |
|----------------------|-----------------|
| **Testing** | Up to 100 test users you add manually |
| **In production** (unverified) | Anyone, but scary “unverified app” warning |
| **Verified** | Anyone, no extra warning for your scopes |

For a public Play Store / App Store launch, plan on **verification**.

---

## Prerequisites

1. **Published privacy policy** — live at `https://returnrider-api.onrender.com/legal/privacy` (or your production domain).
2. **Published terms** — `https://returnrider-api.onrender.com/legal/terms`.
3. **Support contact** — email on consent screen and in app (Settings → Privacy).
4. **Domain verification** — verify ownership of your marketing domain in [Google Search Console](https://search.google.com/search-console).
5. **OAuth client** — Web application client with redirect URIs documented in `GOOGLE_OAUTH_SETUP.md`.

---

## Step 1 — Prepare the consent screen

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**.
2. **App information**
   - App name: `ReturnRider`
   - App logo: 120×120 PNG (optional but helps review)
   - Application home page: your marketing site (e.g. Vercel `apps/web` deploy)
   - Privacy policy link: production `/legal/privacy` URL
   - Terms link: production `/legal/terms` URL
   - Authorized domains: add your marketing + API hostnames (no `https://` prefix)
3. **Scopes** — keep only what you need:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `openid`, `email` (if used)
4. **Test users** — keep your own Gmail for pre-verification QA.

---

## Step 2 — Submit for verification

1. On the consent screen, click **Publish app** or **Prepare for verification**.
2. Choose **Submit for verification** when prompted for restricted scopes.
3. Fill the **Gmail API** justification form. Suggested wording:

   > ReturnRider is a personal finance utility that scans **shopping-related** emails to detect return deadlines and refund status. We request `gmail.readonly` to read order confirmation and return-label messages only. Users can disconnect anytime and export or delete their account from Settings. We do not send email, modify labels, or share inbox data with third parties.

4. **Demo video** (often required):
   - 2–3 minutes, unlisted YouTube link
   - Show: install → Connect Gmail → OAuth consent → one return appearing on dashboard → Settings → disconnect inbox → delete account (or export data)
5. **Data handling** — explain retention, encryption, and that refresh tokens are stored server-side encrypted.

Typical review time: **2–6 weeks** (can be longer for first-time apps).

---

## Step 3 — Production checklist

After approval:

| Item | Action |
|------|--------|
| Consent screen | Set to **In production** |
| Redirect URIs | Add production Expo / custom scheme URIs from EAS builds |
| API env | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` on Render |
| Mobile env | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in EAS secrets |
| Monitoring | Watch Gmail API quota in Cloud Console |

---

## Common rejection reasons

- Privacy policy missing Gmail-specific language → add a “Gmail data” section describing read-only use and deletion.
- Demo video skips OAuth screen → show the full consent flow.
- Scope too broad → do not request `gmail.modify` or full `gmail` scope.
- App not reachable → ensure marketing URL and legal pages load without auth.

---

## Staging vs production

- **Staging (Render):** Keep **Testing** mode; add tester Gmail accounts only.
- **Production:** Separate Google Cloud project or same project with verified consent screen before marketing to strangers.

Do not flip to **In production** without verification unless you accept the unverified-app warning for all users.
