-- VisitGarut Rating MVP. Additive and idempotent: safe to run more than once, touches no existing table.

-- Optional sector override per place (e.g. a 'kuliner' listing that is really an oleh-oleh shop).
ALTER TABLE vg_places ADD COLUMN IF NOT EXISTS rating_sector varchar(16)
 CHECK (rating_sector IS NULL OR rating_sector IN ('kuliner','kafe','penginapan','wisata','umkm','rental','tur','jasa'));

-- Physical QR plates ("Titik Ulasan"). The code is printed on the plate; it carries no score.
CREATE TABLE IF NOT EXISTS vg_rating_plates (
 id serial PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 code varchar(10) NOT NULL UNIQUE,
 location_note varchar(80) NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT true,
 installed_at timestamptz NOT NULL DEFAULT now(),
 last_audit_at timestamptz,
 audit_note text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS vg_rating_plates_place_idx ON vg_rating_plates(place_id);

-- Phones of owners/staff/family registered when a business is claimed: blocked from rating that business.
CREATE TABLE IF NOT EXISTS vg_rating_insiders (
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 phone_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(place_id, phone_hash)
);

-- A check-in starts when a visitor scans a plate. Raw phone is kept only until the invite is sent (+30 days max).
CREATE TABLE IF NOT EXISTS vg_rating_checkins (
 id uuid PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 plate_id integer REFERENCES vg_rating_plates(id) ON DELETE SET NULL,
 geo_match boolean NOT NULL DEFAULT false,
 phone_hash char(64),
 phone_raw varchar(16),
 otp_hash char(64),
 otp_expires_at timestamptz,
 otp_attempts smallint NOT NULL DEFAULT 0,
 verified_at timestamptz,
 invite_hash char(64) UNIQUE,
 invite_after timestamptz,
 invited_at timestamptz,
 invite_expires_at timestamptz,
 opted_out boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vg_rating_checkins_due_idx ON vg_rating_checkins(invite_after) WHERE invited_at IS NULL AND verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS vg_rating_checkins_phone_idx ON vg_rating_checkins(place_id, phone_hash, created_at DESC);

-- Reviews. One per check-in. Held as pending until a moderator decides; the same rules apply to good and bad reviews.
CREATE TABLE IF NOT EXISTS vg_rating_reviews (
 id serial PRIMARY KEY,
 checkin_id uuid NOT NULL UNIQUE REFERENCES vg_rating_checkins(id) ON DELETE CASCADE,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 phone_hash char(64) NOT NULL,
 sector varchar(16) NOT NULL,
 overall smallint NOT NULL CHECK (overall BETWEEN 1 AND 5),
 body text NOT NULL DEFAULT '' CHECK (length(body) <= 1500),
 party varchar(12) NOT NULL CHECK (party IN ('sendiri','teman','keluarga','rombongan','kerja')),
 evidence varchar(10) NOT NULL CHECK (evidence IN ('receipt','qr_geo','otp_only')),
 display_name varchar(40) NOT NULL DEFAULT '',
 status varchar(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
 moderation_note text NOT NULL DEFAULT '',
 business_reply text NOT NULL DEFAULT '' CHECK (length(business_reply) <= 1500),
 created_at timestamptz NOT NULL DEFAULT now(),
 decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS vg_rating_reviews_place_idx ON vg_rating_reviews(place_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS vg_rating_reviews_queue_idx ON vg_rating_reviews(status, created_at) WHERE status='pending';

CREATE TABLE IF NOT EXISTS vg_rating_review_aspects (
 review_id integer NOT NULL REFERENCES vg_rating_reviews(id) ON DELETE CASCADE,
 aspect varchar(24) NOT NULL,
 rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
 PRIMARY KEY(review_id, aspect)
);

-- Score plaques. Issued only at tier "tinggi"; status page is public.
CREATE TABLE IF NOT EXISTS vg_rating_plaques (
 serial varchar(12) PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 score_at_issue numeric(2,1) NOT NULL CHECK (score_at_issue BETWEEN 1 AND 5),
 reviewers_at_issue integer NOT NULL CHECK (reviewers_at_issue >= 15),
 issued_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 status varchar(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
 status_note text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS vg_rating_plaques_place_idx ON vg_rating_plaques(place_id, issued_at DESC);
CREATE SEQUENCE IF NOT EXISTS vg_rating_plaque_seq;

-- Daily rate-limit counters keyed by an HMAC (never a raw IP or phone).
CREATE TABLE IF NOT EXISTS vg_rating_limits (
 key char(64) PRIMARY KEY,
 hits integer NOT NULL DEFAULT 1,
 resets_at timestamptz NOT NULL
);
