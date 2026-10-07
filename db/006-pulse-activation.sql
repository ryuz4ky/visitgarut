-- Publication of original comments is separate from permission to derive metrics.
ALTER TABLE vg_youtube_videos ADD COLUMN IF NOT EXISTS embeddable boolean NOT NULL DEFAULT false;
ALTER TABLE vg_youtube_videos ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE vg_youtube_videos ADD COLUMN IF NOT EXISTS relevance_note text NOT NULL DEFAULT '';
ALTER TABLE vg_youtube_comments ADD COLUMN IF NOT EXISTS public_status varchar(12) NOT NULL DEFAULT 'pending'
 CHECK(public_status IN ('pending','approved','rejected','withdrawn'));
ALTER TABLE vg_youtube_comments ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE vg_youtube_comments ADD COLUMN IF NOT EXISTS moderation_note text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS vg_youtube_comments_public_idx
 ON vg_youtube_comments(video_id,published_at DESC,id DESC) WHERE public_status='approved';
ALTER TABLE vg_social_mentions ADD COLUMN IF NOT EXISTS source_identity_reference text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS vg_mention_ratings (
 mention_id integer NOT NULL REFERENCES vg_social_mentions(id) ON DELETE CASCADE,
 dimension varchar(24) NOT NULL CHECK(dimension IN ('overall','akses','kebersihan','harga','fasilitas','keluarga','parkir','keamanan','keramaian')),
 rating smallint NOT NULL CHECK(rating BETWEEN 1 AND 5),
 PRIMARY KEY(mention_id,dimension)
);
ALTER TABLE vg_pulse_reports ADD COLUMN IF NOT EXISTS youtube_comment_id bigint REFERENCES vg_youtube_comments(id) ON DELETE SET NULL;
ALTER TABLE vg_youtube_videos ADD COLUMN IF NOT EXISTS comment_refresh_started_at timestamptz;
