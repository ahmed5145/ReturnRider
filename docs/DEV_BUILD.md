# Development builds (without guessing Apple requirements)

## Do you need a dev build right now?

| Feature | Expo Go (free) | Dev build |
|---------|----------------|-----------|
| Gmail OAuth | Yes (working) | Yes |
| Dashboard / returns | Yes | Yes |
| Push notifications | No (removed SDK 53+) | Yes |
| Apple / Google Wallet | Limited | Full |

**If Gmail and the dashboard work in Expo Go, you can keep developing without a dev build.** Push and Wallet are the main reasons to upgrade later.

---

## iOS on a physical iPhone

Apple requires a paid **Apple Developer Program** membership (**$99/year**) to install a custom app on your own iPhone (development or TestFlight builds).

- EAS cannot complete an iOS device build without Apple credentials.
- **No Apple account** → cancel the Apple ID prompt; use **Expo Go** for now.

When you are ready:

1. Enroll: [developer.apple.com/programs](https://developer.apple.com/programs/)
2. Run: `npx eas-cli build --profile development --platform ios`
3. Log in with your Apple ID when prompted (EAS manages certs).
4. Install the build from the link EAS provides (internal distribution).

---

## Android (no Apple account needed)

If you have an Android phone, you can build and install a dev client for **free**:

```cmd
cd apps\mobile
npx eas-cli build --profile development --platform android
```

Download the `.apk` from the EAS dashboard and install on your device. Then:

```cmd
npx expo start --dev-client
```

Scan the QR code with your **dev build** app (not Expo Go).

---

## Expo Go workflow (current — recommended without Apple)

After `expo-dev-client` is installed, plain `expo start` defaults to **development build** mode. That QR code only works if you installed a custom ReturnRider dev build — **not** the iPhone Camera app or Expo Go.

**Use Expo Go** (no Apple Developer account):

```cmd
cd apps\mobile
npm start
```

Or explicitly:

```cmd
npx expo start --go -c
```

Metro should say `Using Expo Go` (not `Using development build`). Open the **Expo Go** app → scan the QR from inside Expo Go, or use the Camera app if it offers “Open in Expo Go”.

**Quick fix if you already started Metro:** press **`s`** in the terminal to switch to Expo Go.

**When you have a dev build installed** (Android APK or iOS after Apple enrollment):

```cmd
npm run start:dev-client
```

Gmail connect, settings, and returns all work in Expo Go. Push notifications need a dev build.

### Test push after installing dev build

1. Open app → **Settings** → **Enable notifications**
2. Tap **Send test push** (calls `POST /api/v1/users/test-push`)
3. Tap a real deadline reminder notification → opens that return’s detail screen

---

## Encryption export (iOS builds)

`ITSAppUsesNonExemptEncryption: false` is set in `app.config.js` so EAS does not prompt on every build.
