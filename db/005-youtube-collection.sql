CREATE TABLE IF NOT EXISTS vg_youtube_places (
 place_id integer PRIMARY KEY REFERENCES vg_places(id) ON DELETE CASCADE,
 queries jsonb NOT NULL CHECK(jsonb_typeof(queries)='array'), query_index integer NOT NULL DEFAULT 0,
 next_page text NOT NULL DEFAULT '', search_done boolean NOT NULL DEFAULT false,
 next_task varchar(12) NOT NULL DEFAULT 'search' CHECK(next_task IN ('search','comments')),
 next_comment_kind varchar(12) NOT NULL DEFAULT 'threads' CHECK(next_comment_kind IN ('threads','replies')),
 enabled boolean NOT NULL DEFAULT true, last_error varchar(40) NOT NULL DEFAULT '',
 last_run_at timestamptz, completed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vg_youtube_places_queue_idx ON vg_youtube_places(last_run_at) WHERE enabled;
CREATE TABLE IF NOT EXISTS vg_youtube_videos (
 id serial PRIMARY KEY, place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 video_id varchar(11) NOT NULL CHECK(video_id ~ '^[A-Za-z0-9_-]{11}$'),
 title text NOT NULL, description text NOT NULL DEFAULT '', channel_id varchar(255) NOT NULL,
 channel_title text NOT NULL, published_at timestamptz NOT NULL,
 search_query text NOT NULL, review_status varchar(12) NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
 next_page text NOT NULL DEFAULT '', threads_done boolean NOT NULL DEFAULT false,
 last_fetched_at timestamptz, last_error varchar(40) NOT NULL DEFAULT '',
 collected_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '29 days',
 UNIQUE(place_id,video_id)
);
CREATE INDEX IF NOT EXISTS vg_youtube_videos_queue_idx ON vg_youtube_videos(place_id,last_fetched_at) WHERE review_status<>'rejected' AND NOT threads_done;
CREATE TABLE IF NOT EXISTS vg_youtube_comments (
 id bigserial PRIMARY KEY, video_id integer NOT NULL REFERENCES vg_youtube_videos(id) ON DELETE CASCADE,
 source_key varchar(255) NOT NULL, parent_key varchar(255), author_name text NOT NULL,
 author_channel_id varchar(255) NOT NULL DEFAULT '', original_text text NOT NULL,
 published_at timestamptz NOT NULL, likes integer NOT NULL DEFAULT 0 CHECK(likes>=0),
 collected_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '29 days',
 UNIQUE(video_id,source_key)
);
CREATE INDEX IF NOT EXISTS vg_youtube_comments_video_date_idx ON vg_youtube_comments(video_id,published_at DESC);
CREATE INDEX IF NOT EXISTS vg_youtube_comments_expiry_idx ON vg_youtube_comments(expires_at);
CREATE TABLE IF NOT EXISTS vg_youtube_replies (
 video_id integer NOT NULL REFERENCES vg_youtube_videos(id) ON DELETE CASCADE,
 parent_key varchar(255) NOT NULL, next_page text NOT NULL DEFAULT '', done boolean NOT NULL DEFAULT false,
 last_run_at timestamptz, last_error varchar(40) NOT NULL DEFAULT '', PRIMARY KEY(video_id,parent_key)
);
CREATE INDEX IF NOT EXISTS vg_youtube_replies_queue_idx ON vg_youtube_replies(last_run_at) WHERE NOT done;
CREATE TABLE IF NOT EXISTS vg_youtube_usage (
 quota_day date NOT NULL, bucket varchar(12) NOT NULL CHECK(bucket IN ('search','data')),
 calls integer NOT NULL CHECK(calls>0), PRIMARY KEY(quota_day,bucket)
);
