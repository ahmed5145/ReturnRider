-- Email subject from source message (for subject-level skip lists later)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_email_subject TEXT;

ALTER TABLE parse_feedback
  ADD COLUMN IF NOT EXISTS email_subject TEXT;
