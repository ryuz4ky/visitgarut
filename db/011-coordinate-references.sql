-- Public source inspection: 14 October 2026. Points are location references,
-- not verified entrances, route distances, or on-site inspections.
ALTER TABLE vg_places ADD COLUMN IF NOT EXISTS coordinate_reference jsonb;
UPDATE vg_places p SET latitude=v.lat,longitude=v.lon,
 coordinate_reference=jsonb_build_object('latitude',v.lat,'longitude',v.lon,'source_url',v.url,'publisher',v.publisher,'checked_at','2026-10-14','note',v.note),
 updated_at=now()
FROM (VALUES
 ('candi-cangkuang',-7.102816::double precision,107.918922::double precision,'https://jelajahcagarbudaya.id/node/149','Jelajah Cagar Budaya','Titik candi menurut uraian inventaris lokasi, bukan pintu masuk atau dermaga. Periksa akses penyeberangan sebelum berangkat.'),
 ('darajat-pass',-7.218123::double precision,107.744652::double precision,'https://darajatpass.com/kontak/','Darajat Pass','Titik panorama peta yang disematkan pada halaman kontak pengelola. Menunjukkan kawasan wisata, bukan kepastian titik masuk.'),
 ('bale-tingtrim-resto',-7.1850728::double precision,107.8894954::double precision,'https://baletingtrimresto.com/kontak','Bale Tingtrim Resto','Titik pada metadata lokasi dan peta halaman kontak pengelola. Konfirmasikan titik kedatangan kepada restoran.'),
 ('kampung-sampireun',-7.2024308::double precision,107.8117504::double precision,'https://kampungsampireun.com/','Kampung Sampireun Resort & Spa','Titik pada metadata lokasi dan profil properti di situs pengelola. Konfirmasikan akses masuk dan kedatangan dengan pengelola.'),
 ('favehotel-cimanuk-garut',-7.203599::double precision,107.889961::double precision,'https://www.favehotels.com/id/hotel/view/29/favehotel-cimanuk','favehotels — Archipelago','Titik pada metadata lokasi dan profil Hotel di situs jaringan pengelola. Konfirmasikan akses masuk sebelum kedatangan.'),
 ('hotel-santika-premiere-garut',-7.1753325::double precision,107.8864859::double precision,'https://www.mysantika.com/indonesia/garut/hotel-santika-garut','MySantika','Titik latitude dan longitude pada profil Hotel Santika Premiere Garut di situs jaringan pengelola. Bukan titik destinasi sekitar yang ditampilkan pada halaman yang sama.')
) AS v(slug,lat,lon,url,publisher,note)
WHERE p.slug=v.slug AND p.status='published' AND p.latitude IS NULL AND p.longitude IS NULL AND p.coordinate_reference IS NULL;
