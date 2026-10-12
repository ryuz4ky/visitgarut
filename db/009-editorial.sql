-- Backward-compatible editorial attribution and version history.
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS source_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '';
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS image_credit text NOT NULL DEFAULT '';
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS author_type varchar(20) NOT NULL DEFAULT 'Organization';
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS reviewed_by varchar(120) NOT NULL DEFAULT '';
ALTER TABLE vg_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE TABLE IF NOT EXISTS vg_content_revisions (
 id bigserial PRIMARY KEY,
 kind varchar(12) NOT NULL CHECK(kind IN ('place','article','event')),
 content_id integer NOT NULL,
 snapshot jsonb NOT NULL,
 saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vg_content_revisions_lookup ON vg_content_revisions(kind,content_id,saved_at DESC);
