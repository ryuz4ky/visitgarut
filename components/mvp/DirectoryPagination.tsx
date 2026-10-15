import Link from 'next/link'
import {directoryPageHref,type PlaceSearch} from '@/lib/mvp/search'

export default function DirectoryPagination({path,page,pages,filters={}}:{path:string;page:number;pages:number;filters?:PlaceSearch}){
  if(pages<=1)return null
  return <nav className="vg-directory-pagination" aria-label="Halaman direktori">
    <div>{page>1&&<Link href={directoryPageHref(path,page-1,filters)} rel="prev">← Sebelumnya</Link>}</div>
    <div><span aria-current="page">Halaman {page} dari {pages}</span>{page>2&&<Link href={directoryPageHref(path,1,filters)}>Ke halaman pertama</Link>}</div>
    <div>{page<pages&&<Link href={directoryPageHref(path,page+1,filters)} rel="next">Berikutnya →</Link>}</div>
  </nav>
}
