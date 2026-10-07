export type YoutubeComment={id:string;author:string;authorId:string;text:string;publishedAt:string;likes:number;sourceUrl:string}
type Thread={snippet:{topLevelComment:{id:string;snippet:{authorDisplayName:string;authorChannelId?:{value:string};textOriginal?:string;textDisplay:string;publishedAt:string;likeCount:number}}}}
export const youtubeImportMessages={
 youtube:'Impor belum berhasil. Coba kembali atau periksa sumber video.',
 youtube_comments_disabled:'Komentar dinonaktifkan oleh pemilik video. Pilih video lain yang komentarnya terbuka.',
 youtube_video_unavailable:'Video tidak ditemukan atau tidak dapat diakses melalui API. Periksa tautan video.',
 youtube_access:'Akses YouTube API ditolak. Periksa aktivasi API dan pembatasan API key di Google Cloud.',
 youtube_daily_budget:'Batas pengumpulan harian VisitGarut tercapai. Antrean akan dilanjutkan pada hari kuota berikutnya.',
 youtube_quota:'Kuota YouTube API habis atau batas permintaan tercapai. Coba kembali setelah kuota tersedia.',
 youtube_connection:'Koneksi ke YouTube belum berhasil. Coba kembali beberapa saat.',
 youtube_consent:'Baca dan centang persetujuan sebelum mengimpor komentar.',
 youtube_content:'Pilih video YouTube yang sudah disetujui di Konten sosial.',
 youtube_invalid_id:'ID video YouTube tidak valid. Periksa tautan pada Konten sosial.',
 youtube_empty:'Tidak ada komentar yang memenuhi batas 20–4.000 karakter pada 50 komentar terbaru video ini.',
 youtube_storage:'Komentar belum berhasil disimpan. Tidak ada perubahan dari percobaan impor ini; coba kembali.'
} as const
export type YoutubeImportCode=keyof typeof youtubeImportMessages
export class YoutubeImportError extends Error{constructor(public readonly code:YoutubeImportCode){super(youtubeImportMessages[code]);this.name='YoutubeImportError'}}
export function youtubeApiErrorCode(reason:string,status:number):YoutubeImportCode{
 if(reason==='commentsDisabled')return 'youtube_comments_disabled'
 if(reason==='videoNotFound'||status===404)return 'youtube_video_unavailable'
 if(['quotaExceeded','dailyLimitExceeded','rateLimitExceeded','userRateLimitExceeded'].includes(reason)||status===429)return 'youtube_quota'
 return status===400||status===401||status===403?'youtube_access':'youtube_connection'
}
export function normalizeYoutubeComments(items:Thread[],videoId:string):YoutubeComment[]{
 return items.map(t=>{const c=t.snippet.topLevelComment;return {id:c.id,author:c.snippet.authorDisplayName,authorId:c.snippet.authorChannelId?.value||'',text:c.snippet.textOriginal||c.snippet.textDisplay,publishedAt:c.snippet.publishedAt,likes:c.snippet.likeCount,sourceUrl:`https://www.youtube.com/watch?v=${videoId}&lc=${encodeURIComponent(c.id)}`}}).filter(c=>{
  // PostgreSQL length(text) counts Unicode characters; JS string.length counts UTF-16 units.
  const length=Array.from(c.text).length
  return length>=20&&length<=4000
 })
}
