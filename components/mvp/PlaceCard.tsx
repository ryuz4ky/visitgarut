import Link from 'next/link'
import {Mountain,MapPin,ArrowUpRight,BedDouble,Utensils,Coffee,Car,Bike,Compass} from 'lucide-react'
import {categories} from '@/lib/mvp/categories'
import type {SavedPlaceCard} from '@/lib/mvp/saved'
import SaveButton from '@/components/saved/SaveButton'
export default function PlaceCard({place}:{place:SavedPlaceCard}) {
  const cat=categories.find(c=>c.slug===place.category)
  const Icon=place.category==='transportasi'&&/\bmotor\b/i.test(place.name)?Bike:({wisata:Mountain,hotel:BedDouble,kuliner:Utensils,cafe:Coffee,transportasi:Car,'paket-wisata':Compass})[place.category]||MapPin
  const rental=place.category==='transportasi'
  return <article className="vg-card-shell"><Link className={`vg-card${rental&&!place.image_url?' vg-card-service':''}`} href={`/${place.category}/${place.slug}`}>
    <div className={`vg-card-image cat-${place.category}`}>
      {place.image_url?<img src={place.image_url} alt={place.name} loading="lazy" width={600} height={400}/>:<div className="vg-image-empty"><Icon size={rental?36:44} strokeWidth={1.4}/>{!rental&&<><span>{place.district || 'Garut'}</span><small>Foto belum tersedia</small></>}</div>}
      <span className="vg-tag">{cat?.name}</span>
    </div>
    <div className="vg-card-body"><p className="vg-location"><MapPin size={14}/>{place.district || 'Melayani Garut'}</p><h3>{place.name}</h3><p>{place.excerpt}</p><span className="vg-card-cta">{rental?'Info layanan & kontak':'Kenali tempat'} <ArrowUpRight size={16}/></span></div>
  </Link><div className="vg-card-save"><SaveButton compact id={place.id} name={place.name}/></div></article>
}
