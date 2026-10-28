import Link from 'next/link'
import {Mountain,MapPin,BedDouble,Utensils,Coffee,Car,Bike,Compass,Plus,Info,ShoppingBag,Wrench} from 'lucide-react'
import {categories} from '@/lib/mvp/categories'
import type {SavedPlaceCard} from '@/lib/mvp/saved'
import type {PracticalInfo} from '@/lib/visit/practical'
import SaveButton from '@/components/saved/SaveButton'
import {compactRupiah,knownTicket,checkedLabel} from '@/lib/mvp/format'
import {ScoreRing} from '@/components/rating/bits'
import {tierLabels,type Tier} from '@/lib/rating/core'

export type CardRating={score:number|null;tier:Tier;reviewers:number}

type CardPlace=SavedPlaceCard&{practical?:PracticalInfo|null}
const plannable=['wisata','kuliner','cafe']

export default function PlaceCard({place,rating}:{place:CardPlace;rating?:CardRating}) {
  const cat=categories.find(c=>c.slug===place.category)
  const Icon=place.category==='transportasi'&&/\bmotor\b/i.test(place.name)?Bike:({wisata:Mountain,hotel:BedDouble,kuliner:Utensils,cafe:Coffee,transportasi:Car,'paket-wisata':Compass,'oleh-oleh':ShoppingBag,jasa:Wrench})[place.category]||MapPin
  const rental=place.category==='transportasi'
  const href=`/${place.category}/${place.slug}`
  const ticket=knownTicket(place.practical)
  const checked=checkedLabel(place.practical)
  const unknownTicket=place.category==='wisata'&&place.practical!==undefined&&ticket===null
  const canPlan=place.canPlan??plannable.includes(place.category)
  return <article className="vg-card-shell"><div className={`vg-card${rental&&!place.image_url?' vg-card-service':''}`}>
    <Link className={`vg-card-image cat-${place.category}`} href={href} tabIndex={-1} aria-hidden="true">
      {place.image_url?<img src={place.image_url} alt="" loading="lazy" width={600} height={400}/>:<div className="vg-image-empty"><Icon size={rental?36:44} strokeWidth={1.4}/>{!rental&&<><span>{place.district || 'Garut'}</span><small>Foto belum tersedia</small></>}</div>}
      <span className="vg-tag">{cat?.name}</span>
      {rating&&rating.tier!=='kurang'&&<span className="vg-card-rating"><ScoreRing score={rating.score} tier={rating.tier} size="sm"/><span><strong>{tierLabels[rating.tier]}</strong><small>{rating.reviewers} pengunjung</small></span></span>}
    </Link>
    <div className="vg-card-body">
      <div className="vg-card-titlerow">
        <span><h3><Link className="vg-card-link" href={href}>{place.name}</Link></h3><span className="vg-card-meta">{[cat?.name,place.district||(rental?'Melayani Garut':'Garut')].filter(Boolean).join(' · ')}</span></span>
        {ticket!==null&&<span className="vg-card-price">{ticket===0?'Gratis':`± ${compactRupiah(ticket)}`}</span>}
      </div>
      {place.excerpt&&<p className="vg-card-excerpt">{place.excerpt}</p>}
      <div className="vg-card-foot">
        {unknownTicket?<span className="vg-card-flag is-warn"><Info size={13} aria-hidden="true"/>Tarif perlu konfirmasi</span>:checked?<span className="vg-card-flag"><i aria-hidden="true"/>{checked}</span>:<span className="vg-card-flag">{rental?'Konfirmasi tarif ke penyedia':'Lihat sumber di halaman'}</span>}
        {canPlan&&<Link className="vg-card-plan" href={`/trip?add=${place.id}`} aria-label={`Tambahkan ${place.name} ke rencana`}><Plus size={15} aria-hidden="true"/>Rencana</Link>}
      </div>
    </div>
  </div><div className="vg-card-save"><SaveButton compact id={place.id} name={place.name}/></div></article>
}
