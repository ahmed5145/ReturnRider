# Google OAuth & Limited Use Compliance

## Scopes (minimum)

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read commerce-related messages only |
| `openid`, `email` | Account identity |

**Never request:** `gmail.modify`, `gmail.send`, `gmail.compose`

## Gmail query filter (server-enforced)

```
newer_than:90d (subject:(order OR receipt OR confirmation OR return OR refund OR shipment OR tracking) OR from:(noreply OR no-reply OR orders OR shipping OR returns))
```

## Limited Use requirements

1. Use data only to provide user-requested return/refund tracking.
2. No transfer except to processors (AWS, EasyPost, Plaid) under contract.
3. No ads, no sale of Gmail-derived data.
4. No human reading except security incidents (audited).
5. Privacy Policy URL on OAuth consent screen.
6. Complete Google OAuth verification for sensitive scopes before production.

## Verification checklist

- [ ] OAuth consent screen configured
- [ ] Privacy Policy hosted at public URL
- [ ] Demo video for restricted scopes
- [ ] Security assessment (if required)
