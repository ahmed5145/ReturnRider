-- Parser feedback from users ("not a return", etc.)
CREATE TABLE IF NOT EXISTS parse_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  merchant_name TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parse_feedback_user ON parse_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_parse_feedback_reason ON parse_feedback(reason);
