# Data Security Standards

## In transit

- TLS 1.3 for all client ↔ API and API ↔ third-party traffic
- Certificate pinning recommended for mobile (v1.1)

## At rest

| Data | Method |
|------|--------|
| OAuth refresh tokens | AES-256-GCM (`CryptoService`), per-record ciphertext |
| Plaid access tokens | AES-256-GCM in `users.plaid_access_token_enc` |
| PostgreSQL volume | Provider TDE (RDS) |
| S3 wallet assets | SSE-KMS |

## Key management

- Master key via `ENCRYPTION_MASTER_KEY` (dev) or AWS KMS (production)
- Annual DEK rotation; force re-auth on `invalid_grant`

## Logging

- No raw email bodies in application logs
- Redact bearer tokens and refresh tokens
