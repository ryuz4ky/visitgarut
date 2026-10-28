-- Businesses asking for a VisitGarut Rating plate. Additive; safe to run again.
CREATE TABLE IF NOT EXISTS vg_rating_applications (
 id serial PRIMARY KEY,
 business_name varchar(120) NOT NULL,
 category varchar(40) NOT NULL,
 district varchar(80) NOT NULL DEFAULT '',
 contact_name varchar(80) NOT NULL,
 contact_phone varchar(20) NOT NULL,
 note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
 status varchar(12) NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','dihubungi','terpasang','ditolak')),
 admin_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vg_rating_applications_status_idx ON vg_rating_applications(status, created_at DESC);
