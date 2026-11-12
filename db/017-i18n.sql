-- Translations of places and articles. A page in another language exists only when a row exists here. Additive; safe to run again.
CREATE TABLE IF NOT EXISTS vg_i18n (
 kind varchar(10) NOT NULL CHECK (kind IN ('place','article')),
 ref_id integer NOT NULL,
 lang varchar(5) NOT NULL,
 title text NOT NULL DEFAULT '',
 excerpt text NOT NULL DEFAULT '',
 content text NOT NULL DEFAULT '',
 source_updated_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (kind, ref_id, lang)
);
