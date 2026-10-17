-- Voluntary, first-party evaluation. No itinerary, URL, contact, or money fields.
CREATE TABLE IF NOT EXISTS vg_trip_validation (
 session uuid PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(),
 stages text[] NOT NULL DEFAULT '{}',
 helpfulness varchar(8) CHECK(helpfulness IN ('yes','partly','no')),
 barrier varchar(12) CHECK(barrier IN ('costs','transport','access','time','choice','other','none')),
 withdrawn boolean NOT NULL DEFAULT false,
 CHECK ((helpfulness IS NULL) = (barrier IS NULL)),
 CHECK (cardinality(stages) <= 11 AND stages <@ ARRAY['opened','selected','budget_viewed','time_viewed','route_requested','route_received','plan_completed','share_copied','summary_copied','maps_opened','operator_opened']::text[]),
 CHECK ((withdrawn AND cardinality(stages)=0 AND helpfulness IS NULL AND barrier IS NULL) OR (NOT withdrawn AND 'opened'=ANY(stages)))
);
CREATE INDEX IF NOT EXISTS vg_trip_validation_created ON vg_trip_validation(created_at);
CREATE TABLE IF NOT EXISTS vg_trip_validation_limits (
 key char(64) PRIMARY KEY,
 requests integer NOT NULL CHECK(requests > 0),
 resets_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS vg_trip_validation_limits_expiry ON vg_trip_validation_limits(resets_at);
