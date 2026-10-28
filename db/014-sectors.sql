-- The directory covers every sector rated by VisitGarut Rating. Widens the category check only; safe to run again.
DO $$
DECLARE c record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='vg_places'::regclass AND conname='vg_places_category_check'
                 AND pg_get_constraintdef(oid) LIKE '%oleh-oleh%') THEN
    FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='vg_places'::regclass AND contype='c'
             AND pg_get_constraintdef(oid) LIKE '%paket-wisata%' LOOP
      EXECUTE format('ALTER TABLE vg_places DROP CONSTRAINT %I', c.conname);
    END LOOP;
    ALTER TABLE vg_places ADD CONSTRAINT vg_places_category_check
      CHECK (category IN ('wisata','hotel','kuliner','cafe','transportasi','paket-wisata','oleh-oleh','jasa'));
  END IF;
END $$;
