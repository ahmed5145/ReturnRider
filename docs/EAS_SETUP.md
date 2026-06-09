# EAS Build setup (account: ahmed5145)

## Correct dashboard URL

**Builds:** https://expo.dev/accounts/ahmed5145/projects/returnrider/builds

---

## Fix: "Entity not authorized" / wrong project ID

The old EAS project `aa737750-...` was under **`ahmedm1`**.  
Current project (ahmed5145): **`bb385e3a-8199-4ff2-a65a-6f6a4826983a`** — see `app.json` → `extra.eas.projectId`.

### Steps (run in **cmd**, from `apps\mobile`)

**1. Confirm login**
```cmd
npx eas-cli whoami
```
Must show `ahmed5145`. If not:
```cmd
npx eas-cli logout
npx eas-cli login
```

**2. Verify project ID** (already created for ahmed5145)

`apps/mobile/app.json` should contain:
```json
"extra": { "eas": { "projectId": "bb385e3a-8199-4ff2-a65a-6f6a4826983a" } }
```

And `apps/mobile/.env`:
```
EXPO_PUBLIC_EAS_PROJECT_ID=bb385e3a-8199-4ff2-a65a-6f6a4826983a
```

If `eas init` errored after "Created @ahmed5145/returnrider", the project still exists — you can skip re-running init.

**3. Build**
```cmd
npm install
npx eas-cli build --profile development --platform android
```

Track builds: https://expo.dev/accounts/ahmed5145/projects/returnrider/builds

---

## Google OAuth redirect (Expo Go)

Google Cloud Console → Web client → Authorized redirect URIs:

```
https://auth.expo.io/@ahmed5145/returnrider
```

Remove `https://auth.expo.io/@ahmedm1/returnrider` if you added it earlier.

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

---

## After APK installs

```cmd
npm run start:dev-client
```

1. Settings → **Enable notifications**
2. **Send test push**
3. Optional: **Connect bank** (Plaid sandbox + API `PLAID_*` env)

---

## Queue times

Free tier often waits **15–60+ minutes** on "Build queued…". Ctrl+C is fine — check the dashboard for status.

**Limits:** 15 Android + 15 iOS builds per calendar month, 1 concurrent build, low-priority queue. See [CI_CD.md](./CI_CD.md).

---

## CI/CD (GitHub Actions)

After the repo is on GitHub:

1. Add secret **`EXPO_TOKEN`** (expo.dev → Access tokens).
2. **Actions → EAS Build → Run workflow** queues the same builds as local `eas build` (non-blocking).
3. PRs run API build + mobile typecheck via `ci.yml`.

Full plan: [CI_CD.md](./CI_CD.md).
