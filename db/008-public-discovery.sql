CREATE TABLE IF NOT EXISTS vg_discovery_sources (
 id bigserial PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 platform varchar(20) NOT NULL CHECK(platform IN ('instagram','tiktok','threads','x','youtube')),
 source_url text NOT NULL,
 source_key varchar(64) NOT NULL,
 source_title varchar(300) NOT NULL DEFAULT '',
 source_snippet text NOT NULL DEFAULT '',
 search_query text NOT NULL DEFAULT '',
 search_provider varchar(40) NOT NULL DEFAULT 'duckduckgo_html',
 relevance_score smallint NOT NULL DEFAULT 0 CHECK(relevance_score BETWEEN 0 AND 100),
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 content_id integer REFERENCES vg_social_contents(id) ON DELETE SET NULL,
 discovered_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 UNIQUE(place_id,source_url)
);
CREATE INDEX IF NOT EXISTS vg_discovery_sources_queue_idx ON vg_discovery_sources(status,place_id,relevance_score DESC,discovered_at DESC);
CREATE INDEX IF NOT EXISTS vg_discovery_sources_platform_idx ON vg_discovery_sources(place_id,platform,status);
