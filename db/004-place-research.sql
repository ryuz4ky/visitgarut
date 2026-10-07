-- Editorial source research is deliberately separate from visitor experiences.
CREATE TABLE IF NOT EXISTS vg_place_research (
 id serial PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 topic varchar(40) NOT NULL CHECK (topic IN ('pemandangan','aktivitas','keluarga','pelayanan','harga','akses','parkir','kebersihan','fasilitas','keramaian','keamanan')),
 title varchar(200) NOT NULL,
 summary text NOT NULL CHECK (char_length(summary) BETWEEN 20 AND 1200),
 source_url text NOT NULL CHECK (source_url ~ '^https://'),
 publisher varchar(200) NOT NULL,
 source_kind varchar(20) NOT NULL CHECK (source_kind IN ('authority','operator','report','directory')),
 source_published_at date,
 checked_at timestamptz NOT NULL DEFAULT now(),
 limitations text NOT NULL DEFAULT '',
 status varchar(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','withdrawn')),
 UNIQUE(place_id,source_url,topic)
);
CREATE INDEX IF NOT EXISTS vg_place_research_place_status_idx ON vg_place_research(place_id,status);
