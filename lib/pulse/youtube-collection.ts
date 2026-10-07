import { YoutubeImportError,youtubeApiErrorCode } from './youtube-core'
export type SearchQuery={q:string;order:'relevance'|'date'}
export type VideoResult={id:string;title:string;description:string;channelId:string;channelTitle:string;publishedAt:string}
export type RawComment={id:string;parentId:string|null;author:string;authorId:string;text:string;publishedAt:string;likes:number}
export type ThreadResult={comment:RawComment;replyCount:number}
export type VideoPage={items:VideoResult[];next:string}
export type ThreadPage={items:ThreadResult[];next:string}
export type ReplyPage={items:RawComment[];next:string}
export interface CollectionApi{search(query:SearchQuery,page:string):Promise<VideoPage>;threads(video:string,page:string):Promise<ThreadPage>;replies(parent:string,page:string):Promise<ReplyPage>}
export function locationQueries(name:string,aliases:string[]=[]):SearchQuery[]{
 const canonical=name.split(/\s+[–—]\s+/)[0].trim()
 const short=canonical.replace(/^(Gunung|Pantai|Curug|Situ|Desa Wisata|Taman Air)\s+/i,'')
 const terms=[...new Set([canonical,short,...aliases].map(s=>s.trim().replace(/["|]/g,'')).filter(s=>s.length>=4&&!/^(rental|sewa)\s+(mobil|motor)\s+garut$/i.test(s)))].slice(0,4)
 return terms.flatMap(term=>{const q='"'+term+'"'+(/\bgarut\b/i.test(term)?'':' Garut');return [{q,order:'relevance' as const},{q,order:'date' as const}]})
}
function rawComment(c:{id:string;snippet:{parentId?:string;authorDisplayName:string;authorChannelId?:{value:string};textOriginal?:string;textDisplay:string;publishedAt:string;likeCount:number}}):RawComment{
 const s=c.snippet;return {id:c.id,parentId:s.parentId||null,author:s.authorDisplayName,authorId:s.authorChannelId?.value||'',text:s.textOriginal??s.textDisplay,publishedAt:s.publishedAt,likes:s.likeCount||0}
}
export class YoutubeCollectionApi implements CollectionApi{
 constructor(private key:string,private reserve:(bucket:'search'|'data')=>Promise<void>,private request:typeof fetch=fetch){}
 private async call(endpoint:string,params:Record<string,string>,bucket:'search'|'data'){
  if(!this.key)throw new YoutubeImportError('youtube_access')
  await this.reserve(bucket)
  const u=new URL('https://www.googleapis.com/youtube/v3/'+endpoint);u.search=new URLSearchParams({...params,key:this.key}).toString()
  try{const r=await this.request(u,{signal:AbortSignal.timeout(12000),cache:'no-store'});const data=await r.json();if(!r.ok)throw new YoutubeImportError(youtubeApiErrorCode(data.error?.errors?.[0]?.reason||'',r.status));return data}catch(e){if(e instanceof YoutubeImportError)throw e;throw new YoutubeImportError('youtube_connection')}
 }
 async search(query:SearchQuery,page=''):Promise<VideoPage>{const d=await this.call('search',{part:'snippet',type:'video',q:query.q,order:query.order,maxResults:'50',relevanceLanguage:'id',regionCode:'ID',...(page?{pageToken:page}:{})},'search');return {items:(d.items||[]).filter((v:{id:{videoId?:string}})=>/^[\w-]{11}$/.test(v.id.videoId||'')).map((v:{id:{videoId:string};snippet:{title:string;description:string;channelId:string;channelTitle:string;publishedAt:string}})=>({id:v.id.videoId,title:v.snippet.title,description:v.snippet.description,channelId:v.snippet.channelId,channelTitle:v.snippet.channelTitle,publishedAt:v.snippet.publishedAt})),next:d.nextPageToken||''}}
 async threads(video:string,page=''):Promise<ThreadPage>{const d=await this.call('commentThreads',{part:'snippet',videoId:video,maxResults:'100',order:'time',textFormat:'plainText',...(page?{pageToken:page}:{})},'data');return {items:(d.items||[]).map((t:{snippet:{topLevelComment:Parameters<typeof rawComment>[0];totalReplyCount:number}})=>({comment:rawComment(t.snippet.topLevelComment),replyCount:t.snippet.totalReplyCount||0})),next:d.nextPageToken||''}}
 async replies(parent:string,page=''):Promise<ReplyPage>{const d=await this.call('comments',{part:'snippet',parentId:parent,maxResults:'100',textFormat:'plainText',...(page?{pageToken:page}:{})},'data');return {items:(d.items||[]).map(rawComment),next:d.nextPageToken||''}}
}
