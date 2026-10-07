export const ratingDimensions={overall:'Keseluruhan',akses:'Jalan & akses',kebersihan:'Kebersihan',harga:'Harga & nilai',fasilitas:'Fasilitas',keluarga:'Bersama keluarga',parkir:'Parkir',keamanan:'Rasa aman',keramaian:'Kenyamanan saat ramai'} as const
export type RatingDimension=keyof typeof ratingDimensions
export type DimensionRating={dimension:RatingDimension;rating:number}
export function contributionRatings(f:FormData):DimensionRating[]{
 const result:DimensionRating[]=[]
 for(const dimension of Object.keys(ratingDimensions) as RatingDimension[]){const value=String(f.get('rating_'+dimension)||'');if(!value)continue;const rating=Number(value);if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('Invalid dimension rating');result.push({dimension,rating})}
 return result
}
export function publicIdentityReference(value:string){
 if(!value.trim())return ''
 const u=new URL(value.trim());const host=u.hostname.toLowerCase().replace(/^www\./,'')
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['instagram.com','youtube.com','tiktok.com','x.com','twitter.com','threads.net','threads.com'].includes(host)||u.pathname==='/'||u.pathname.length>255)throw Error('Invalid profile')
 const path=u.pathname.replace(/\/$/,'');const valid=host==='youtube.com'?/^\/(channel\/UC[\w-]{22}|@[\w.-]+)$/.test(path):host==='instagram.com'?/^\/[\w.]+$/.test(path)&&!['/p','/reel','/stories'].includes(path):['tiktok.com','threads.net','threads.com'].includes(host)?/^\/@[\w.-]+$/.test(path):/^\/[\w]+$/.test(path)
 if(!valid)throw Error('Use a profile URL')
 return 'https://'+(host==='twitter.com'?'x.com':host==='threads.net'?'threads.com':host)+(host==='youtube.com'&&path.startsWith('/channel/')?path:path.toLowerCase())
}
