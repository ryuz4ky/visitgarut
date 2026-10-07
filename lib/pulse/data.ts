import 'server-only'
import { db } from '@/lib/mvp/db'
import { calculatePulse,type Mention,type Platform } from './core'
import { youtubeAuthorUrl } from './youtube-public'
import type { ResearchEvidence } from './research'
export type SocialContent={id:number;platform:Platform;source_url:string;source_post_id:string;title:string;creator:string;creator_url:string|null;published_at:string|null;checked_at:string|null;comments_available:boolean;api_source:boolean;can_embed:boolean}
export async function pulseForPlace(id:number,includeYoutube=false){
 const youtubeApproved=!!process.env.YOUTUBE_DERIVED_METRICS_APPROVAL_REFERENCE
 const [mentions,contents,research]=await Promise.all([
  db().query(`SELECT m.*,to_char(m.experience_date,'YYYY-MM-DD') AS experience_day,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('topic',t.topic,'sentiment',t.sentiment)) FROM vg_mention_topics t WHERE t.mention_id=m.id),'[]') AS topics,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('dimension',r.dimension,'rating',r.rating)) FROM vg_mention_ratings r WHERE r.mention_id=m.id),'[]') AS ratings
  FROM vg_social_mentions m WHERE m.place_id=$1 AND m.status='approved' AND ($2::boolean OR m.rights_basis<>'youtube_api')
  AND m.published_at>=now()-interval '90 days' AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.published_at DESC LIMIT 1000`,[id,includeYoutube&&youtubeApproved]),
  db().query(`SELECT * FROM (
   SELECT -v.id AS id,'youtube' AS platform,'https://www.youtube.com/watch?v='||v.video_id AS source_url,v.video_id AS source_post_id,v.title,v.channel_title AS creator,v.channel_id AS creator_id,v.published_at,v.collected_at AS checked_at,true AS api_source,v.embeddable AS can_embed,
   EXISTS(SELECT 1 FROM vg_youtube_comments c WHERE c.video_id=v.id AND c.public_status='approved' AND c.reviewed_at IS NOT NULL AND c.expires_at>now() AND c.parent_key IS NULL AND v.last_error NOT IN ('youtube_comments_disabled','youtube_video_unavailable')) AS comments_available
   FROM vg_youtube_videos v WHERE v.place_id=$1 AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now()
   UNION ALL
   SELECT s.id,s.platform,s.source_url,s.source_post_id,s.title,s.creator,'' AS creator_id,NULL::timestamptz AS published_at,s.reviewed_at AS checked_at,false AS api_source,false AS can_embed,false AS comments_available
   FROM vg_social_contents s WHERE s.place_id=$1 AND s.status='approved' AND NOT EXISTS(SELECT 1 FROM vg_youtube_videos v WHERE v.place_id=s.place_id AND s.platform='youtube' AND v.video_id=s.source_post_id AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now())
  ) sources ORDER BY api_source DESC,published_at DESC NULLS LAST,id DESC LIMIT 24`,[id]),
  db().query("SELECT id,topic,title,summary,source_url,publisher,source_kind,to_char(source_published_at,'YYYY-MM-DD') AS source_published_at,checked_at,limitations FROM vg_place_research WHERE place_id=$1 AND status='approved' ORDER BY id LIMIT 24",[id])
 ])
 const rows=mentions.rows.map(m=>({...m,published_at:m.published_at.toISOString(),experience_date:m.experience_day,expires_at:m.expires_at?.toISOString()||null,reviewed_at:m.reviewed_at?.toISOString()||null})) as Mention[]
 const social=contents.rows.map(c=>({id:c.id,platform:c.platform,source_url:c.source_url,source_post_id:c.source_post_id,title:c.title,creator:c.creator,creator_url:youtubeAuthorUrl(c.creator_id),published_at:c.published_at?.toISOString()||null,checked_at:c.checked_at?.toISOString()||null,comments_available:c.comments_available,api_source:c.api_source,can_embed:c.can_embed})) as SocialContent[]
 const youtubeAvailable=youtubeApproved&&(await db().query("SELECT 1 FROM vg_social_mentions WHERE place_id=$1 AND status='approved' AND rights_basis='youtube_api' AND expires_at>now() AND published_at>=now()-interval '90 days' LIMIT 1",[id])).rowCount!>0
 return {pulse:calculatePulse(rows,Date.now(),youtubeApproved),contents:social,research:research.rows.map(r=>({...r,checked_at:new Date(r.checked_at).toISOString()})) as ResearchEvidence[],youtubeAvailable}
}
