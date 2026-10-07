export type YoutubeOriginalComment = {
 id:string; author:string; authorUrl:string|null; text:string; publishedAt:string;
 likes:number; sourceUrl:string; checkedAt:string;
 parent:{author:string;authorUrl:string|null;text:string;publishedAt:string;sourceUrl:string}|null
}
export type YoutubeCommentPage = {
 video:{id:string;title:string;creator:string;sourceUrl:string;publishedAt:string;checkedAt:string};
 comments:YoutubeOriginalComment[];nextPage:number|null
}
export function youtubePublicQuery(place:number,video:string,page=0,order='newest'){
 if(!Number.isSafeInteger(place)||place<=0||!/^[\w-]{11}$/.test(video)||!Number.isSafeInteger(page)||page<0||page>500||!['newest','engagement'].includes(order))throw Error('Invalid comment request')
 return {text:`SELECT c.id::text,c.source_key,c.author_name,c.author_channel_id,c.original_text,c.published_at,c.likes,c.collected_at,
 parent.author_name AS parent_author,parent.author_channel_id AS parent_channel,parent.original_text AS parent_text,parent.published_at AS parent_published_at,parent.source_key AS parent_source_key
 FROM vg_youtube_comments c
 JOIN vg_youtube_videos v ON v.id=c.video_id
 JOIN vg_places p ON p.id=v.place_id
 LEFT JOIN vg_youtube_comments parent ON parent.video_id=c.video_id AND parent.source_key=c.parent_key AND parent.public_status='approved' AND parent.expires_at>now()
 WHERE p.id=$1 AND p.status='published' AND v.video_id=$2 AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now() AND v.last_error NOT IN ('youtube_comments_disabled','youtube_video_unavailable')
 AND c.public_status='approved' AND c.reviewed_at IS NOT NULL AND c.expires_at>now() AND (c.parent_key IS NULL OR parent.id IS NOT NULL)
 ORDER BY ${order==='engagement'?'c.likes DESC,':''}c.published_at DESC,c.id DESC LIMIT 21 OFFSET $3`,values:[place,video,page*20]}
}
export const youtubeSourceUrl=(video:string,comment?:string)=>'https://www.youtube.com/watch?v='+video+(comment?'&lc='+encodeURIComponent(comment):'')
export function youtubeAuthorUrl(id:string){return /^UC[\w-]{22}$/.test(id)?'https://www.youtube.com/channel/'+id:null}
