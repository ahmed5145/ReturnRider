# Google OAuth setup (Gmail connect)

ReturnRider uses **OAuth 2.0 with PKCE** on mobile and exchanges the auth code on the API. You need one Google Cloud project and credentials in two places.

## 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. **Select project** → **New project** → name it e.g. `ReturnRider`.
3. Enable **Gmail API**: **APIs & Services** → **Library** → search **Gmail API** → **Enable**.

## 2. OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**.
2. User type: **External** (for real users) or **Internal** (Google Workspace only).
3. App name: `ReturnRider`, support email, developer contact.
4. Scopes: add `https://www.googleapis.com/auth/gmail.readonly` (and `openid`, `email` if prompted).
5. Test users: while in **Testing**, add your Gmail address as a test user.

> Production with sensitive scopes requires [Google verification](https://support.google.com/cloud/answer/9110914). Testing mode works for up to 100 test users without verification.

## 3. Create OAuth client IDs

You need credentials for **mobile (PKCE)** and **server token exchange**.

### Option A — Recommended for Expo dev (Web client + custom scheme)

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `ReturnRider Mobile`.
4. **Authorized redirect URIs** — add the URI Expo prints when you connect Gmail (or build it):
   - Run the app, tap Connect Gmail once; check Metro logs for `redirectUri`, or use:
   - `returnrider://` (from `scheme` in `app.json`)
   - Expo Go often uses: `https://auth.expo.io/@YOUR_EXPO_USERNAME/returnrider`
5. Copy the **Client ID** → this is `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

For the **same** Web client (or a second Web client):

6. Create another **Web application** client named `ReturnRider API` (optional but cleaner).
7. Copy **Client ID** and **Client secret** → API env vars below.

### Option B — Native clients (production builds)

- **iOS**: OAuth client type **iOS**, bundle ID `com.returnrider.app`.
- **Android**: OAuth client type **Android**, package `com.returnrider.app`, SHA-1 from your keystore.

Use the **iOS or Android client ID** as `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in store builds. Web client + custom scheme is simpler for local Expo Go testing.

## 4. Environment variables

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000/api/v1
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

`EXPO_PUBLIC_GOOGLE_CLIENT_ID` is the **OAuth 2.0 Client ID** string from step 3 — not the project number, not the API key.

Restart Metro after changing `.env`: `npx expo start -c`.

### API (`apps/api/.env`)

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

The API uses these to exchange the authorization code for refresh tokens (`apps/api/src/emails/gmail.service.ts`). Client ID should match the mobile client used for the auth request.

## 5. Verify the flow

1. API running on `0.0.0.0:3000`.
2. Mobile `.env` uses your PC LAN IP (not `localhost` on a physical phone).
3. Open app → onboarding → **Connect Gmail**.
4. Sign in with a **test user** account (if consent screen is in Testing).
5. API should store encrypted refresh token and schedule email sync.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add exact redirect URI from logs to Google Console |
| `access_denied` | Add your Gmail as OAuth test user |
| `Set EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Create `.env` in `apps/mobile` and restart Expo |
| Token exchange fails on API | Match `GOOGLE_CLIENT_ID` / `SECRET` to the client that issued the code |

## Where each value lives

| Variable | Source |
|----------|--------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google Console → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_ID` | Same or API-specific Web client ID |
| `GOOGLE_CLIENT_SECRET` | Same client's secret (API only — never put in mobile) |
