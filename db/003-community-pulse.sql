ALTER TABLE vg_places ADD COLUMN IF NOT EXISTS google_place_id varchar(255) NOT NULL DEFAULT '';
ALTER TABLE vg_places ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS vg_social_contents (
 id serial PRIMARY KEY, place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 platform varchar(20) NOT NULL CHECK(platform IN ('google','youtube','instagram','tiktok','threads','x','visitgarut')),
 source_url text NOT NULL, source_post_id varchar(255) NOT NULL DEFAULT '',
 title varchar(200) NOT NULL, creator varchar(160) NOT NULL DEFAULT '',
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
 reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(place_id,source_url)
);
CREATE TABLE IF NOT EXISTS vg_social_mentions (
 id serial PRIMARY KEY, place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 content_id integer REFERENCES vg_social_contents(id) ON DELETE SET NULL,
 platform varchar(20) NOT NULL CHECK(platform IN ('google','youtube','instagram','tiktok','threads','x','visitgarut')),
 source_url text NOT NULL DEFAULT '', source_key varchar(255) NOT NULL,
 display_name varchar(120) NOT NULL DEFAULT '', original_text text NOT NULL CHECK(length(original_text) BETWEEN 20 AND 4000),
 independence_key varchar(128), fingerprint varchar(64) NOT NULL,
 published_at timestamptz NOT NULL, experience_date date,
 sentiment varchar(12) NOT NULL DEFAULT 'unclassified' CHECK(sentiment IN ('positive','neutral','negative','mixed','unclassified')),
 rights_basis varchar(24) NOT NULL CHECK(rights_basis IN ('first_party','creator_permission','licensed','youtube_api')),
 permission_reference text NOT NULL DEFAULT '', analysis_allowed boolean NOT NULL DEFAULT false,
 is_sensitive boolean NOT NULL DEFAULT false, verification_reference text NOT NULL DEFAULT '',
 engagement_count integer NOT NULL DEFAULT 0 CHECK(engagement_count>=0),
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn','spam')),
 expires_at timestamptz, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(place_id,platform,source_key), UNIQUE(place_id,fingerprint),
 CHECK(rights_basis<>'youtube_api' OR (platform='youtube' AND expires_at IS NOT NULL)),
 CHECK(platform<>'google'),
 CHECK(rights_basis NOT IN ('creator_permission','licensed') OR permission_reference<>'')
);
CREATE INDEX IF NOT EXISTS vg_pulse_mentions_place_idx ON vg_social_mentions(place_id,status,published_at DESC);
CREATE TABLE IF NOT EXISTS vg_mention_topics (
 mention_id integer NOT NULL REFERENCES vg_social_mentions(id) ON DELETE CASCADE,
 topic varchar(32) NOT NULL CHECK(topic IN ('pemandangan','aktivitas','keluarga','pelayanan','harga','akses','parkir','kebersihan','fasilitas','keramaian','keamanan')),
 sentiment varchar(12) NOT NULL CHECK(sentiment IN ('positive','neutral','negative','mixed')),
 PRIMARY KEY(mention_id,topic)
);
CREATE TABLE IF NOT EXISTS vg_place_insights (
 place_id integer PRIMARY KEY REFERENCES vg_places(id) ON DELETE CASCADE,
 payload jsonb NOT NULL, calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vg_pulse_reports (
 id serial PRIMARY KEY, mention_id integer REFERENCES vg_social_mentions(id) ON DELETE SET NULL,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 message text NOT NULL CHECK(length(message) BETWEEN 10 AND 2000),
 status varchar(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','resolved')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vg_pulse_limits (
 key varchar(64) PRIMARY KEY, attempts integer NOT NULL DEFAULT 1,
 resets_at timestamptz NOT NULL DEFAULT now()+interval '1 day'
);
