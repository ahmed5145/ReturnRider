# Google Wallet production setup

ReturnRider already generates Google Wallet save URLs in `apps/api/src/wallet/wallet.service.ts`. Production requires a Google Pay & Wallet Console issuer account.

## Prerequisites

- Google Cloud project with **Google Wallet API** enabled
- Issuer account approved in [Google Pay & Wallet Console](https://pay.google.com/business/console)
- Service account JSON with Wallet Object Issuer permissions

## Environment variables (API)

```env
GOOGLE_WALLET_ISSUER_ID=your_numeric_issuer_id
GOOGLE_WALLET_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
```

Without these, the API returns a **dev stub URL** (`?dev=1`) — fine for smoke tests.

## Steps

1. Create issuer in Google Wallet Console
2. Create service account → download JSON → store outside repo (e.g. `wallet-certs/google-service-account.json`, gitignored)
3. Link service account email as **Developer** on the issuer
4. Set env vars on API host (Render/local)
5. In app: Return detail → **Add to Google Wallet** → opens save URL

## Apple Wallet

Requires Apple Developer ($99/year) + pass type ID + signing certs. Deferred until enrollment.

See `wallet-certs/README.md` when added.
