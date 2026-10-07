import 'server-only'
import { normalizeYoutubeComments,YoutubeImportError,youtubeApiErrorCode,type YoutubeComment } from './youtube-core'
export type { YoutubeComment } from './youtube-core'
export async function fetchYoutubeComments(videoId:string):Promise<YoutubeComment[]>{
 if(!/^[\w-]{11}$/.test(videoId))throw new YoutubeImportError('youtube_invalid_id')
 const key=process.env.YOUTUBE_API_KEY;if(!key)throw new YoutubeImportError('youtube_access')
 const u=new URL('https://www.googleapis.com/youtube/v3/commentThreads');u.search=new URLSearchParams({part:'snippet',videoId,maxResults:'50',order:'time',textFormat:'plainText',key}).toString()
 try{
  const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(12000)})
  const data=await r.json()
  if(!r.ok)throw new YoutubeImportError(youtubeApiErrorCode(data.error?.errors?.[0]?.reason||'',r.status))
  return normalizeYoutubeComments(data.items||[],videoId)
 }catch(error){if(error instanceof YoutubeImportError)throw error;throw new YoutubeImportError('youtube_connection')}
}
export async function fetchYoutubeVideo(videoId:string){
 if(!/^[\w-]{11}$/.test(videoId)||!process.env.YOUTUBE_API_KEY)throw new YoutubeImportError('youtube_access')
 const {db}=await import('@/lib/mvp/db');const {reserveYoutubeCall}=await import('./youtube-pipeline');const client=await db().connect()
 try{
  await reserveYoutubeCall(client,'data')
  const u=new URL('https://www.googleapis.com/youtube/v3/videos');u.search=new URLSearchParams({part:'snippet,status',id:videoId,key:process.env.YOUTUBE_API_KEY}).toString()
  const response=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(12000)}),data=await response.json()
  if(!response.ok)throw new YoutubeImportError(youtubeApiErrorCode(data.error?.errors?.[0]?.reason||'',response.status))
  const v=data.items?.[0];if(!v||v.status?.privacyStatus!=='public')throw new YoutubeImportError('youtube_video_unavailable')
  return {title:v.snippet.title as string,description:v.snippet.description as string,channelId:v.snippet.channelId as string,creator:v.snippet.channelTitle as string,publishedAt:v.snippet.publishedAt as string,embeddable:v.status.embeddable===true}
 }catch(error){if(error instanceof YoutubeImportError)throw error;throw new YoutubeImportError('youtube_connection')}finally{client.release()}
}
