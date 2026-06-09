-- Return label link extracted from email (PDF vault v1: URL to merchant label page)
ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_label_url TEXT;
