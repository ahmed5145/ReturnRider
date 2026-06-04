-- ReturnRider v1 schema — PostgreSQL 16+
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE email_provider AS ENUM ('gmail', 'outlook', 'yahoo', 'icloud', 'imap_generic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE link_status AS ENUM ('connected', 'syncing', 'error', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_source AS ENUM ('email_parse', 'manual', 'forward_in');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE return_status AS ENUM (
    'draft', 'ready_to_ship', 'in_transit', 'delivered_to_merchant',
    'awaiting_refund', 'refund_completed', 'expired', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_source AS ENUM ('plaid', 'user', 'merchant_email', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tracking_status AS ENUM (
    'unknown', 'pre_transit', 'in_transit', 'out_for_delivery',
    'delivered', 'delivered_to_merchant', 'exception', 'return_to_sender'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_auth_id  TEXT UNIQUE NOT NULL,
  email             CITEXT UNIQUE NOT NULL,
  display_name      TEXT,
  timezone          TEXT NOT NULL DEFAULT 'America/New_York',
  quiet_hours_start TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end   TIME NOT NULL DEFAULT '08:00',
  status            user_status NOT NULL DEFAULT 'active',
  plaid_user_id     TEXT,
  plaid_access_token_enc BYTEA,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS linked_emails (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider              email_provider NOT NULL,
  email_address         CITEXT NOT NULL,
  status                link_status NOT NULL DEFAULT 'connected',
  oauth_refresh_enc     BYTEA NOT NULL,
  oauth_refresh_key_id  TEXT NOT NULL,
  scopes_granted        TEXT[] NOT NULL,
  last_sync_cursor      TEXT,
  last_sync_at          TIMESTAMPTZ,
  last_error            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_address)
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_email_id   UUID REFERENCES linked_emails(id) ON DELETE SET NULL,
  merchant_name     TEXT NOT NULL,
  merchant_domain   TEXT,
  external_order_id TEXT NOT NULL,
  order_date        DATE,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  total_amount      DECIMAL(12,2),
  source            order_source NOT NULL DEFAULT 'email_parse',
  raw_confidence    DECIMAL(4,3),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, merchant_name, external_order_id)
);

CREATE TABLE IF NOT EXISTS returns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status                return_status NOT NULL DEFAULT 'draft',
  return_deadline_at    TIMESTAMPTZ,
  return_window_days    INT,
  item_summary          TEXT NOT NULL,
  expected_refund_amount DECIMAL(12,2),
  qr_payload            TEXT,
  qr_format             TEXT,
  qr_expires_at         TIMESTAMPTZ,
  wallet_apple_serial   TEXT UNIQUE,
  wallet_google_object_id TEXT UNIQUE,
  tracking_number       TEXT,
  carrier               TEXT,
  dropped_off_at        TIMESTAMPTZ,
  delivered_to_merchant_at TIMESTAMPTZ,
  snooze_count          INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id         UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  tracking_number   TEXT NOT NULL,
  carrier           TEXT NOT NULL,
  status            tracking_status NOT NULL,
  status_detail     TEXT,
  location_city     TEXT,
  location_state    TEXT,
  event_at          TIMESTAMPTZ NOT NULL,
  provider          TEXT NOT NULL DEFAULT 'easypost',
  provider_event_id TEXT,
  raw_payload       JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (return_id, provider_event_id)
);

CREATE TABLE IF NOT EXISTS refund_status (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id         UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','matched','completed','disputed')),
  expected_amount   DECIMAL(12,2),
  actual_amount     DECIMAL(12,2),
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  source            refund_source,
  plaid_transaction_id TEXT,
  posted_at         TIMESTAMPTZ,
  match_confidence  DECIMAL(4,3),
  user_confirmed_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (return_id)
);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id       UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_id      TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','cancelled','failed')),
  bull_job_id     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (return_id, trigger_id)
);

CREATE TABLE IF NOT EXISTS parse_review_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_email_id UUID NOT NULL REFERENCES linked_emails(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id      TEXT NOT NULL,
  merchant_guess  TEXT,
  raw_snippet     TEXT,
  confidence      DECIMAL(4,3) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (linked_email_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_returns_user_status_deadline ON returns(user_id, status, return_deadline_at);
CREATE INDEX IF NOT EXISTS idx_returns_tracking ON returns(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_logs_return_event ON tracking_logs(return_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_date ON orders(user_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_linked_emails_user ON linked_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_status_user_posted ON refund_status(user_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_scheduled ON notification_jobs(scheduled_at) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_linked_emails_updated ON linked_emails;
CREATE TRIGGER trg_linked_emails_updated BEFORE UPDATE ON linked_emails
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_returns_updated ON returns;
CREATE TRIGGER trg_returns_updated BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_refund_status_updated ON refund_status;
CREATE TRIGGER trg_refund_status_updated BEFORE UPDATE ON refund_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
