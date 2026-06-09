# Plaid setup (sandbox → production)

ReturnRider uses Plaid for optional **refund radar** — matching bank deposits to open returns. Sandbox is **free** and sufficient for staging and dev APKs.

---

## Where to paste keys (API only — not mobile)

Plaid secrets live **only on the NestJS API**. The mobile app never sees `PLAID_CLIENT_ID` or `PLAID_SECRET`.

| Where | File / UI | When you need it |
|-------|-----------|------------------|
| **Local API** | `apps/api/.env` | Phone points at `http://LAN_IP:3000/api/v1` |
| **Staging API** | [Render](https://dashboard.render.com/) → `returnrider-api` → **Environment** | Phone uses `returnrider-api.onrender.com` (Expo Go today) |
| **Mobile** | — | **Nothing** — no Plaid vars in `apps/mobile/.env` |
| **Root** | `.env` at repo root | **Not used** — use `apps/api/.env` only |

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=sandbox-xxxxxxxx   # must be the sandbox secret, not production
PLAID_ENV=sandbox
```

After any change: **restart local API** or **redeploy Render**.

Verify staging:

```text
GET https://returnrider-api.onrender.com/health
→ "features": { "plaid": true, ... }
```

**Expo Go on iPhone:** Connect bank needs the **Android dev APK** (Plaid native SDK). Keys on Render still matter once you test on emulator or a friend's Android phone.

---

## 1. Create a Plaid account

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com/).
2. Complete team profile (name, use case: personal finance / expense tracking).
3. Under **Team settings → Keys**, copy:
   - **Client ID**
   - **Sandbox secret** (starts with `sandbox-`)

---

## 2. Render (staging API)

In [Render](https://dashboard.render.com/) → **returnrider-api** → **Environment**:

| Variable | Value |
|----------|--------|
| `PLAID_CLIENT_ID` | From Plaid dashboard |
| `PLAID_SECRET` | Sandbox secret |
| `PLAID_ENV` | `sandbox` |

Redeploy after saving. The API returns **503** with a friendly message if these are missing (`plaid.service.ts`).

### Verify

```bash
curl -s https://returnrider-api.onrender.com/api/v1/health
```

From the mobile app: **Settings → Refund radar → Connect bank**. You should get the Plaid Link UI (sandbox institutions like **First Platypus Bank**).

---

## 3. Mobile app

No Plaid keys in the client. The app calls:

1. `POST /plaid/link-token` — server creates Link token
2. Plaid Link SDK opens (requires **dev build** or EAS APK — not full flow in Expo Go for native Link)

`apps/mobile/lib/plaid-link.ts` surfaces server errors if Plaid is not configured.

---

## 4. Sandbox test credentials

In Plaid Link sandbox, use Plaid’s test institution and credentials from [Plaid docs](https://plaid.com/docs/sandbox/test-credentials/).

After linking: **Settings → Sync refunds now** calls `POST /plaid/sync`.

---

## 5. Local development

Root or `apps/api/.env`:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

Restart the API after changes.

---

## 6. Production (later)

| Step | Notes |
|------|--------|
| Request Production access | Plaid dashboard → request production keys |
| Swap secrets on Render | `PLAID_SECRET` = production secret, `PLAID_ENV` = `production` |
| OAuth redirect | Register app bundle ID / package name in Plaid dashboard |
| Compliance | Plaid may require privacy policy URL and data retention answers |

Production Plaid has per-link pricing — keep bank linking **optional** in UX.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Connect bank → alert about server config | Add `PLAID_*` on Render, redeploy |
| 500 on link-token | Check Render logs; confirm `PLAID_ENV` matches secret type |
| Link does not open in Expo Go | Use EAS dev build (`docs/DEV_BUILD.md`) |
| No matches after sync | Sandbox txs may not match real merchants — expected in dev |
