import { NextRequest,NextResponse } from 'next/server'
import { db } from '@/lib/mvp/db'
import { youtubePublicQuery,youtubeSourceUrl,youtubeAuthorUrl,type YoutubeCommentPage } from '@/lib/pulse/youtube-public'
export const dynamic='force-dynamic'
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;const place=Number(q.get('place'));const video=q.get('video')||'';const page=Number(q.get('page')||0);const order=q.get('order')||'newest'
 let query;try{query=youtubePublicQuery(place,video,page,order)}catch{return NextResponse.json({error:'Permintaan komentar tidak valid.'},{status:400})}
 try{
  const source=(await db().query(`SELECT v.video_id,v.title,v.channel_title,v.published_at,v.collected_at FROM vg_youtube_videos v JOIN vg_places p ON p.id=v.place_id WHERE v.place_id=$1 AND v.video_id=$2 AND p.status='published' AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now() AND v.last_error NOT IN ('youtube_comments_disabled','youtube_video_unavailable')`,[place,video])).rows[0]
  if(!source)return NextResponse.json({error:'Video belum diterbitkan atau perlu diperiksa kembali.'},{status:404})
  const result=await db().query(query.text,query.values)
  const payload:YoutubeCommentPage={video:{id:video,title:source.title,creator:source.channel_title,sourceUrl:youtubeSourceUrl(video),publishedAt:source.published_at.toISOString(),checkedAt:source.collected_at.toISOString()},comments:result.rows.slice(0,20).map(c=>({id:c.id,author:c.author_name,authorUrl:youtubeAuthorUrl(c.author_channel_id),text:c.original_text,publishedAt:c.published_at.toISOString(),likes:c.likes,sourceUrl:youtubeSourceUrl(video,c.source_key),checkedAt:c.collected_at.toISOString(),parent:c.parent_source_key?{author:c.parent_author,authorUrl:youtubeAuthorUrl(c.parent_channel),text:c.parent_text,publishedAt:c.parent_published_at.toISOString(),sourceUrl:youtubeSourceUrl(video,c.parent_source_key)}:null})),nextPage:result.rows.length>20?page+1:null}
  return NextResponse.json(payload,{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})
 }catch{return NextResponse.json({error:'Komentar belum dapat dimuat. Coba lagi sebentar.'},{status:503})}
}
