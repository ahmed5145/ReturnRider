# Email parser — audit & tuning

> **Status:** Tuning sprint implemented (2026-06).  
> **Code:** `apps/api/src/parsers/`

---

## Pipeline

```
Gmail query (commerce filter, exclude promotions)
  → processMessage()
  → isCommerceEmail()          # second-pass filter
  → parseReceipt()             # merchant-specific → generic
  → confidence vs 0.85
      ≥ 0.85 → persistOrderAndReturn()
      < 0.85 → parse_review_queue (if return-related subject)
```

---

## Audit findings (before tuning)

| Issue | Impact |
|-------|--------|
| `isCommerceEmail` matched **any** `noreply@` sender | Marketing mail with “order” in subject → false positives |
| Merchant parsers treated **shipped** emails like returns | “Package shipped” created return deadlines |
| All major parsers always set `returnDeadlineAt` + confidence ~0.88 | No intent distinction |
| Generic parser at 0.8 confidence | Borderline auto-create on weak matches |
| Gmail query included broad `from:noreply` | Pulled promotions/social updates |
| No automated parser tests | Regressions easy |

---

## Tuning implemented

### 1. Commerce classifier (`commerce-classifier.ts`)

- Removed blanket `noreply` match; require **known retailer domain** or **return-related subject** for unknown senders.
- Added `classifyEmailIntent()` — `return_label` · `refund` · `order_confirm` · `shipped` · `other`.
- Expanded `PROMO_EXCLUDE` patterns (newsletters, % off, abandoned cart, etc.).
- Expanded `RETAILER_DOMAINS` (Kohl's, Macy's, Wayfair, Etsy, …).

### 2. Central scoring (`parse-scoring.ts`)

- `scoreParseConfidence()` — single formula for all parsers.
- Return labels score highest; shipped/other penalized.
- `MERCHANT_RETURN_WINDOWS` — per-store default windows.

### 3. Merchant parsers (`merchant-parser-base.ts`)

- Shared logic: skip promo, skip `shipped`/`other`, only create receipts for return/refund/order confirm.
- Amazon kept custom (order ID format) but uses same intent + scoring.

### 4. Generic parser

- Confidence **capped at 0.84** → always lands in **review queue**, never auto-creates.

### 5. Gmail query (`gmail-query.ts`)

- Retailer-focused `from:` clause.
- Excludes `-category:promotions -category:social -category:updates`.

### 6. Tests (`parsers.test.ts`)

```cmd
cd apps\api
npm run test
```

---

## Auto-create vs review

| Email type | Typical confidence | Result |
|------------|-------------------|--------|
| Return label (known store) | 0.90+ | Dashboard |
| Order confirmation (Target, etc.) | ~0.87 | Dashboard |
| Generic / unknown sender | ≤ 0.84 | Review queue |
| Shipped only | — | Skipped |
| Promo / newsletter | — | Skipped |

**Review threshold:** `0.85` in `email-sync.service.ts`

---

## User feedback loop

- **Parse review screen** — confirm or dismiss queued items.
- **Report misparsed** on return detail → `parse_feedback` table.
- **`not_a_return`** → per-user merchant blocklist (`ParseBlocklistService`) skips future auto-creates for that merchant. See [GMAIL_SYNC.md](./GMAIL_SYNC.md).

---

## How to add a merchant

1. Add domain to `RETAILER_DOMAINS` in `commerce-classifier.ts`.
2. Add parser entry in `merchants/index.ts` (dedicated file or `parseGeneric`).
3. Set return window in `MERCHANT_RETURN_WINDOWS` if non-30-day.
4. Add fixture case to `parsers.test.ts`.

---

## Verify after deploy

1. Redeploy API on Render.
2. Settings → connected inbox → **Sync now**.
3. Review queue should be smaller; fewer junk items.
4. Order confirmations from Target/Amazon still appear on dashboard.
5. Shipped-only emails should not create new returns.
