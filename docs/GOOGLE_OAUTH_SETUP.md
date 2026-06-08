# Google OAuth setup (Gmail connect)

ReturnRider uses **OAuth 2.0 with PKCE** on the phone. The API exchanges the auth code for a refresh token. You need one Google Cloud project.

---

## Part A — OAuth consent screen (scopes + test users)

This is a **separate page** from creating the OAuth client.

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your project.
2. Left menu: **APIs & Services** → **OAuth consent screen**.
3. If asked, click **Get started** or **CONFIGURE CONSENT SCREEN**.
4. **User type** → choose **External** → **Create**.
5. **App information** (page 1):
   - App name: `ReturnRider`
   - User support email: your email
   - Developer contact: your email
   - Click **Save and continue**
6. **Scopes** (page 2):
   - Click **Add or remove scopes**
   - Search: `gmail.readonly`
   - Check: `https://www.googleapis.com/auth/gmail.readonly`
   - Also fine to include `openid` and `email` if listed
   - Click **Update** → **Save and continue**
7. **Test users** (page 3) — required while app is in **Testing**:
   - Click **Add users**
   - Enter the Gmail address you will sign in with on the phone
   - **Save and continue**
8. **Summary** → **Back to dashboard**

Also enable Gmail API once: **APIs & Services** → **Library** → search **Gmail API** → **Enable**.

---

## Part B — Create OAuth client (the form you are on)

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**
3. Name: `ReturnRider OAuth Client` (any name is fine)

### Authorized JavaScript origins

**Leave this empty** for ReturnRider. This field is for browser JavaScript apps. The mobile app does not use it.

### Authorized redirect URIs

Add the **exact** redirect URI shown on the app’s **Connect Gmail** screen (green text, selectable).

Typical values:

| How you run the app | Redirect URI to add |
|---------------------|---------------------|
| Expo dev client / production build | `returnrider://` |
| Some Expo Go setups | `https://auth.expo.io/@YOUR_EXPO_USERNAME/returnrider` |

**Always use the URI shown in the app** — copy it from Connect Gmail, paste into Google Console, click **Create**.

4. After create, copy:
   - **Client ID** → mobile + API
   - **Client secret** → API only (click download or show secret)

---

## Part C — Environment variables (fill in after OAuth client exists)

### Mobile — `apps/mobile/.env`

Create this file if it does not exist:

```env
# Your PC LAN IP — run ipconfig, use IPv4 (NOT localhost on a real phone)
EXPO_PUBLIC_API_URL=http://10.22.4.10:3000/api/v1

# From Google Console → Credentials → your Web client → Client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com

# Optional for push — skip until EAS is set up (see below)
# EXPO_PUBLIC_EAS_PROJECT_ID=
```

Restart Metro after saving:

```cmd
cd apps\mobile
npx expo start -c
```

### API — `apps/api/.env`

You should already have database/redis keys. Add or update:

```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

Use the **same Client ID** as mobile. The secret must match that client.

`GOOGLE_REDIRECT_URI` in the API is optional — the mobile app sends the real redirect URI on each connect. You can leave the default or set:

```env
GOOGLE_REDIRECT_URI=returnrider://
```

### What you can skip for now

- Plaid (`PLAID_*`) — refund bank matching, delayed
- EasyPost (`EASYPOST_*`) — package tracking, delayed
- Wallet certs (`APPLE_*`, `GOOGLE_WALLET_*`) — production only
- Firebase (`FIREBASE_*`) — Expo push uses Expo’s service when EAS is configured

---

## Part D — Push notifications / EAS (optional, can delay)

`npx eas login` fails because the package is named **eas-cli**, not `eas`.

In **cmd**:

```cmd
cd C:\Users\hussah01\ReturnRider\apps\mobile
npm install
npx eas-cli login
npx eas-cli init
```

Copy the project UUID into `apps/mobile/.env`:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Until then, push registration is skipped safely — Gmail and returns still work.

---

## Part E — Test the flow

1. Start API: `cd apps\api` → `npm run dev`
2. Start mobile: `cd apps\mobile` → `npx expo start -c`
3. Phone on same Wi‑Fi; `EXPO_PUBLIC_API_URL` uses PC LAN IP
4. App → Connect Gmail → sign in with a **test user** Gmail
5. If `redirect_uri_mismatch`: copy URI from Connect screen again into Google Console

---

## Quick reference

| Variable | Where to get it |
|----------|-----------------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Credentials → OAuth client → Client ID |
| `GOOGLE_CLIENT_ID` | Same Client ID |
| `GOOGLE_CLIENT_SECRET` | Same client → Client secret |
| `EXPO_PUBLIC_API_URL` | `http://YOUR_LAN_IP:3000/api/v1` from `ipconfig` |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | `npx eas-cli init` (optional) |
