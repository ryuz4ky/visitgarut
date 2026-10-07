CREATE TABLE IF NOT EXISTS vg_places (
 id serial PRIMARY KEY, slug varchar(160) UNIQUE NOT NULL, name varchar(200) NOT NULL,
 category varchar(40) NOT NULL CHECK (category IN ('wisata','hotel','kuliner','cafe','transportasi','paket-wisata')),
 district varchar(120) NOT NULL DEFAULT '', address text NOT NULL DEFAULT '',
 excerpt text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '',
 image_url text NOT NULL DEFAULT '', image_credit text NOT NULL DEFAULT '',
 latitude double precision CHECK (latitude BETWEEN -90 AND 90), longitude double precision CHECK (longitude BETWEEN -180 AND 180),
 website text NOT NULL DEFAULT '', whatsapp varchar(24) NOT NULL DEFAULT '',
 source_url text NOT NULL DEFAULT '', status varchar(12) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple',name || ' ' || district || ' ' || excerpt || ' ' || content)) STORED
);
CREATE INDEX IF NOT EXISTS vg_places_search_idx ON vg_places USING gin(search_vector);
CREATE INDEX IF NOT EXISTS vg_places_category_status_idx ON vg_places(category,status);
CREATE TABLE IF NOT EXISTS vg_articles (
 id serial PRIMARY KEY, slug varchar(160) UNIQUE NOT NULL, title varchar(200) NOT NULL,
 excerpt text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '', author varchar(120) NOT NULL DEFAULT 'Tim VisitGarut',
 status varchar(12) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 published_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vg_article_places (
 article_id integer REFERENCES vg_articles(id) ON DELETE CASCADE,
 place_id integer REFERENCES vg_places(id) ON DELETE CASCADE,
 PRIMARY KEY(article_id,place_id)
);
CREATE TABLE IF NOT EXISTS vg_events (
 id serial PRIMARY KEY, slug varchar(160) UNIQUE NOT NULL, title varchar(200) NOT NULL,
 excerpt text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '',
 starts_at timestamptz NOT NULL, ends_at timestamptz CHECK(ends_at IS NULL OR ends_at >= starts_at),
 source_url text NOT NULL DEFAULT '', status varchar(12) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vg_admin (
 id integer PRIMARY KEY CHECK(id=1), password_hash text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vg_login_attempts (
 key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, resets_at timestamptz NOT NULL
);
