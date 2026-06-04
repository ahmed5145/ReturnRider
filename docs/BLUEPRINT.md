# ReturnRider — Production Blueprint

This document is the authoritative product and engineering spec for ReturnRider v1.

> **Note:** The full exhaustive blueprint (PRD, architecture, API contracts, compliance, legal templates) was produced in the planning phase. This file summarizes structure; see also [openapi.yaml](./openapi.yaml), [../db/migrations/001_initial.sql](../db/migrations/001_initial.sql), and [../legal/](../legal/).

## Value proposition

ReturnRider reduces return-window anxiety and refund uncertainty by ingesting commerce-related email signals, computing return deadlines, vaulting QR codes in Apple/Google Wallet, tracking shipments, and detecting bank refunds—without selling email data.

## Repository map

| Component | Path | Stack |
|-----------|------|-------|
| Mobile | `apps/mobile` | Expo SDK 52, React Native, TypeScript |
| API | `apps/api` | NestJS 10, Prisma, BullMQ, PostgreSQL |
| Email worker | `services/email-worker` | Go 1.22, Redis |
| Database | `db/migrations` | PostgreSQL 16 |
| Infrastructure | `infra/terraform/staging` | AWS VPC, RDS, ElastiCache, S3 |
| Legal | `legal/` | ToS, Privacy Policy |
| Compliance | `docs/compliance/` | Google OAuth Limited Use |

## Core APIs (v1)

- `POST /api/v1/emails/connect` — OAuth email linking (Gmail readonly)
- `GET /api/v1/returns/active` — Upcoming return deadlines
- `POST /api/v1/returns/{id}/wallet-pass` — Apple/Google wallet artifacts
- `POST /api/v1/webhooks/tracking/easypost` — Carrier status updates
- `POST /api/v1/plaid/link-token` — Refund detection (opt-in)

## Notification matrix

| Trigger | Offset | Channel |
|---------|--------|---------|
| RET_T7 | T-7 days @ 09:00 local | Push |
| RET_T3 | T-3 days @ 09:00 local | Push |
| RET_T24H | T-24 hours @ 09:00 local | Push |
| RET_T6H | T-6 hours | Push (high priority) |
| RET_OVERDUE | T+1 day @ 10:00 | Push |

## Personas

- **Maya Chen** — Chronic online shopper; needs deadline reminders and wallet QR at drop-off.
- **Jordan Rivera** — Overwhelmed parent; needs low-friction setup and loud Q4 reminders.

## Security

- OAuth: `gmail.readonly` only
- Encryption: AES-256-GCM at rest, TLS 1.3 in transit
- Compliance: Google Limited Use, Apple Privacy Manifest (`apps/mobile/ios/ReturnRider/PrivacyInfo.xcprivacy`)

## KPIs (90-day targets)

- Email connected within 24h: ≥65%
- D30 retention: ≥35%
- Avg refund $ saved/user/month: ≥$45
- Parser precision (top-20 merchants): ≥92%

For the complete PRD prose, SQL, OpenAPI examples, webhook JSON, and legal boilerplate, refer to the project planning document or expand sections in this repo as the product evolves.
