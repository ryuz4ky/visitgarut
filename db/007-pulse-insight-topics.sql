-- Separate traffic and ticket reports so unrelated experiences do not become one claim.
ALTER TABLE vg_mention_topics DROP CONSTRAINT IF EXISTS vg_mention_topics_topic_check;
ALTER TABLE vg_mention_topics ADD CONSTRAINT vg_mention_topics_topic_check
 CHECK(topic IN ('pemandangan','aktivitas','keluarga','pelayanan','harga','akses','lalu_lintas','parkir','kebersihan','fasilitas','keramaian','tiket','keamanan'));
