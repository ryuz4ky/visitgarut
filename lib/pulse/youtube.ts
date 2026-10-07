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
