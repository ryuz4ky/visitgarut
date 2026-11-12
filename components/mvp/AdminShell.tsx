import Link from 'next/link'
import {LayoutDashboard,Orbit,Youtube,Radar,FileSearch,ClipboardCheck,ExternalLink,LogOut,Star,Store} from 'lucide-react'

/** Superadmin layout — artboards A1–A3. Only routes that exist are listed. */
const groups=[
 {label:'Operasional',items:[
  {href:'/admin',label:'Ringkasan & konten',Icon:LayoutDashboard},
  {href:'/admin/pulse',label:'Community Pulse',Icon:Orbit},
  {href:'/admin/pulse/youtube',label:'Video YouTube',Icon:Youtube},
  {href:'/admin/pulse/discovery',label:'Penemuan sumber',Icon:Radar},
  {href:'/admin/pulse/research',label:'Riset tempat',Icon:FileSearch},
  {href:'/admin/rating',label:'VisitGarut Rating',Icon:Star},
  {href:'/admin/data-usaha',label:'Data dari pengelola',Icon:Store},
 ]},
 {label:'Kualitas',items:[
  {href:'/admin/trip-validation',label:'Evaluasi planner',Icon:ClipboardCheck},
 ]},
]

export default function AdminShell({active,children}:{active:string;children:React.ReactNode}){
 return <div className="va">
  <a className="vg-skip" href="#konten-admin">Lewati ke konten</a>
  <aside className="va-side" aria-label="Menu admin">
   <Link className="va-brand" href="/admin"><span className="vg-wordmark">visitgarut<span>.</span></span><small>ADMIN</small></Link>
   <nav>{groups.map(g=><div key={g.label} className="va-group"><span className="va-group-label">{g.label}</span>{g.items.map(({href,label,Icon})=>{const on=active===href;return <Link key={href} href={href} className={on?'is-active':undefined} aria-current={on?'page':undefined}><Icon size={18} aria-hidden="true"/>{label}</Link>})}</div>)}</nav>
   <div className="va-side-foot">
    <Link href="/" target="_blank"><ExternalLink size={16} aria-hidden="true"/>Lihat situs</Link>
    <form method="post" action="/admin/logout"><button type="submit"><LogOut size={16} aria-hidden="true"/>Keluar</button></form>
   </div>
  </aside>
  <main className="va-main" id="konten-admin">{children}</main>
 </div>
}
