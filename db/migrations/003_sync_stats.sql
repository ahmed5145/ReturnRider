-- Phase 2 S1: last-sync observability on linked inboxes
ALTER TABLE linked_emails
  ADD COLUMN IF NOT EXISTS last_sync_messages_scanned INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_returns_created INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_review_queued INT NOT NULL DEFAULT 0;
