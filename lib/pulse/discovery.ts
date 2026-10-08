import { createHash } from 'node:crypto'
import { normalizeSocialUrl, type Platform } from './core'

export type DiscoveryPlatform = Extract<Platform,'instagram'|'tiktok'|'threads'|'x'|'youtube'>
export type SearchHit = {url:string;title:string;snippet:string;query:string;provider:string}
export type DiscoveryCandidate = SearchHit & {platform:DiscoveryPlatform;sourceKey:string;relevanceScore:number}

const siteQueries:Record<Exclude<DiscoveryPlatform,'youtube'>,string[]> = {
 instagram:['site:instagram.com','site:instagram.com/reel'],
 tiktok:['site:tiktok.com/@ inurl:/video/'],
 threads:['site:threads.net/@ inurl:/post/','site:threads.com/@ inurl:/post/'],
 x:['site:x.com inurl:/status/']
}
const issueTerms='(review OR pengalaman OR parkir OR tiket OR harga OR macet OR ramai OR toilet)'
const entity=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim()
const stripTags=(s:string)=>s.replace(/<[^>]+>/g,' ')
const decodeHtml=(s:string)=>stripTags(s)
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'")
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
 .replace(/\s+/g,' ').trim()

export function buildDiscoveryQueries(name:string,aliases:string[]=[]){
 const terms=[name,...aliases].map(s=>s.trim()).filter(Boolean).slice(0,3)
 const queries:string[]=[]
 for(const term of terms){
  for(const sites of Object.values(siteQueries)){
   queries.push(`"${term}" Garut ${sites[0]}`)
  }
 }
 if(terms[0]){
  queries.push(`"${terms[0]}" Garut ${issueTerms} site:instagram.com`)
  queries.push(`"${terms[0]}" Garut ${issueTerms} site:tiktok.com`)
  queries.push(`"${terms[0]}" Garut ${issueTerms} site:threads.net`)
  queries.push(`"${terms[0]}" Garut ${issueTerms} site:x.com`)
 }
 return [...new Set(queries)].slice(0,12)
}

function unwrapSearchUrl(href:string){
 try{
  const value=href.startsWith('//')?'https:'+href:href
  const u=new URL(value,'https://html.duckduckgo.com')
  if(u.hostname.endsWith('duckduckgo.com')&&u.pathname==='/l/'){
   const target=u.searchParams.get('uddg')
   if(target)return decodeURIComponent(target)
  }
  return u.href
 }catch{return ''}
}

export function parseDuckDuckGoHtml(html:string,query:string):SearchHit[]{
 const anchors=[...html.matchAll(/<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
 const results:SearchHit[]=[]
 for(let i=0;i<anchors.length;i++){
  const match=anchors[i];const url=unwrapSearchUrl(match[1]);if(!url)continue
  const start=(match.index||0)+match[0].length,end=anchors[i+1]?.index||Math.min(html.length,start+3500)
  const chunk=html.slice(start,end)
  const snippetMatch=chunk.match(/<(?:a|div)[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div)>/i)
  results.push({url,title:decodeHtml(match[2]).slice(0,300),snippet:decodeHtml(snippetMatch?.[1]||'').slice(0,1200),query,provider:'duckduckgo_html'})
 }
 return results
}

export function platformFromUrl(value:string):DiscoveryPlatform|null{
 try{
  const u=new URL(value);const host=u.hostname.toLowerCase().replace(/^www\./,'')
  if(host==='instagram.com')return 'instagram'
  if(host==='tiktok.com')return 'tiktok'
  if(host==='threads.net'||host==='threads.com')return 'threads'
  if(host==='x.com'||host==='twitter.com')return 'x'
  if(host==='youtube.com'||host==='youtu.be'||host==='m.youtube.com')return 'youtube'
  return null
 }catch{return null}
}

export function normalizeDiscoveryHit(hit:SearchHit,placeName:string,aliases:string[]=[]):DiscoveryCandidate|null{
 const platform=platformFromUrl(hit.url);if(!platform)return null
 let normalized:{url:string;id:string}
 try{normalized=normalizeSocialUrl(hit.url,platform)}catch{return null}
 const hay=entity(`${hit.title} ${hit.snippet} ${hit.query}`),names=[placeName,...aliases].map(entity).filter(Boolean)
 let score=35
 if(names.some(n=>n&&hay.includes(n)))score+=35
 if(hay.includes('garut'))score+=10
 if(/parkir|tiket|harga|macet|ramai|toilet|review|pengalaman/.test(hay))score+=10
 if(hit.title)score+=5
 score=Math.min(100,score)
 return {...hit,url:normalized.url,platform,sourceKey:createHash('sha256').update(platform+'|'+normalized.url).digest('hex'),relevanceScore:score}
}

async function fetchSearch(query:string,signal:AbortSignal){
 const endpoint=process.env.PUBLIC_SEARCH_HTML_ENDPOINT||'https://html.duckduckgo.com/html/'
 const u=new URL(endpoint);u.searchParams.set('q',query)
 const response=await fetch(u,{signal,headers:{'user-agent':'Mozilla/5.0 (compatible; VisitGarutDiscovery/1.0; +https://visitgarut.com/community-pulse/metode)','accept':'text/html,application/xhtml+xml'}})
 if(!response.ok)throw new Error(`search_http_${response.status}`)
 const html=await response.text();if(!html.includes('result__a'))throw new Error('search_no_results_markup')
 return parseDuckDuckGoHtml(html,query)
}

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
export async function discoverPublicSources(placeName:string,aliases:string[]=[]){
 const queries=buildDiscoveryQueries(placeName,aliases),seen=new Map<string,DiscoveryCandidate>(),errors:string[]=[]
 for(const query of queries){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000)
  try{
   const hits=await fetchSearch(query,controller.signal)
   for(const hit of hits.slice(0,10)){
    const candidate=normalizeDiscoveryHit(hit,placeName,aliases);if(!candidate)continue
    const previous=seen.get(candidate.url);if(!previous||candidate.relevanceScore>previous.relevanceScore)seen.set(candidate.url,candidate)
   }
  }catch(error){errors.push(error instanceof Error?error.message:'search_failed')}
  finally{clearTimeout(timer)}
  await sleep(450)
  if(seen.size>=60)break
 }
 return {queries:queries.length,candidates:[...seen.values()].sort((a,b)=>b.relevanceScore-a.relevanceScore).slice(0,60),errors:[...new Set(errors)].slice(0,5)}
}
