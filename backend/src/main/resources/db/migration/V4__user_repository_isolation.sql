-- V4: Multi-tenant User Repository Isolation & Composite Unique Index
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE repositories DROP CONSTRAINT IF EXISTS repositories_url_key;
DROP INDEX IF EXISTS idx_repo_url;
CREATE UNIQUE INDEX IF NOT EXISTS idx_repo_url_user ON repositories (url, user_id);
