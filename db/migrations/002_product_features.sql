-- ReturnRider v1.1 — onboarding, push tokens, sync window
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

ALTER TABLE linked_emails ADD COLUMN IF NOT EXISTS sync_window_days INT NOT NULL DEFAULT 90;
