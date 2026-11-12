-- Information sent in by owners or managers of a listed place. Nothing is shown until an admin accepts it. Additive; safe to run again.
CREATE TABLE IF NOT EXISTS vg_owner_updates (
 id serial PRIMARY KEY,
 place_id integer NOT NULL REFERENCES vg_places(id) ON DELETE CASCADE,
 relation varchar(20) NOT NULL CHECK (relation IN ('pemilik','pengelola','staf')),
 contact_name varchar(80) NOT NULL,
 contact_phone varchar(20) NOT NULL,
 public_whatsapp varchar(20) NOT NULL DEFAULT '',
 website text NOT NULL DEFAULT '' CHECK (length(website) <= 300),
 address text NOT NULL DEFAULT '' CHECK (length(address) <= 300),
 hours text NOT NULL DEFAULT '' CHECK (length(hours) <= 300),
 price_note text NOT NULL DEFAULT '' CHECK (length(price_note) <= 300),
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 1200),
 status varchar(12) NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diterima','ditolak')),
 admin_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS vg_owner_updates_status_idx ON vg_owner_updates(status, created_at DESC);
CREATE INDEX IF NOT EXISTS vg_owner_updates_place_idx ON vg_owner_updates(place_id, status, reviewed_at DESC);
