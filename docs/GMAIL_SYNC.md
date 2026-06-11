# Gmail sync — how ReturnRider ingests mail

> **Related:** [STAGING_DEPLOY.md](./STAGING_DEPLOY.md) · [PARSER_TUNING.md](./PARSER_TUNING.md) · [NORTH_STAR_AUDIT.md](./NORTH_STAR_AUDIT.md)

---

## Current design (Sprint C1)

| Piece | Behavior |
|-------|----------|
| **Initial backfill** | On Gmail connect — last **90** or **180** days (user toggle) |
| **Incremental sync** | BullMQ job `sync-all-inboxes` every **5 minutes** (configurable) |
| **Per-inbox job** | `sync-linked-email` scans commerce-filtered messages |
| **Keep-warm** | UptimeRobot pings `/health` so Render free tier stays awake |

### Configure interval

Env var on API (Render → Environment):

```env
EMAIL_SYNC_INTERVAL_MINUTES=5
```

- **Default:** `5` (was 15 before Sprint C)
- **Range:** 1–60 minutes
- **Disable scheduler:** `EMAIL_SYNC_SCHEDULER_ENABLED=false`

Verify after deploy:

```bash
curl https://returnrider-api.onrender.com/health
```

Response includes `sync_interval_minutes`.

---

## User feedback blocklist (Sprint C3)

When a user taps **Report → Not a return** on a return detail screen:

1. Return is removed (if still draft / ready to ship)
2. `parse_feedback` row is stored with `reason: not_a_return`
3. That merchant is added to a **per-user skip list for generic-parser mail only**

**Important:** Marking an Amazon marketing false positive does **not** block real Amazon order confirmations — those use the dedicated Amazon parser. The skip list only affects the **generic** fallback parser (unknown senders, Kohl's-via-generic, etc.).

**Settings → Skipped merchants** lists blocked names and lets you **Unblock**.

### Parse review (passive mode)

- Dashboard **does not** show a review banner (set-and-forget).
- **Settings → Parse review** links to the queue when items exist (< 7 days old).
- Items older than **7 days** auto-dismiss on each sync cycle.

---

## Future: Gmail `watch` (push from Google)

Polling every 5 minutes is good enough for staging. **Gmail Pub/Sub watch** would give near-real-time mail but requires:

- Google Cloud Pub/Sub topic + subscription
- Public HTTPS webhook on the API (`users.watch` + renewal every 7 days)
- Extra OAuth scope / verification for production

Track as a post-launch optimization when OAuth verification (C4) is done.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No new returns | Settings → last sync time; UptimeRobot up; manual **Sync now** |
| Sync behind banner | API slept — confirm UptimeRobot monitor |
| Same junk merchant keeps appearing | Report **Not a return** once — blocklist applies on next sync |
| Too many Gmail API calls | Raise `EMAIL_SYNC_INTERVAL_MINUTES` to `15` on Render |
