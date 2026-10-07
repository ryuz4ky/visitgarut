export const categories = [
  { slug: 'wisata', name: 'Wisata', shortName: 'Wisata', icon: 'Mountain', unit: 'tempat', description: 'Gunung, danau, pantai, dan pengalaman alam di Garut.' },
  { slug: 'hotel', name: 'Hotel', shortName: 'Hotel', icon: 'BedDouble', unit: 'tempat', description: 'Temukan penginapan untuk perjalananmu.' },
  { slug: 'kuliner', name: 'Kuliner', shortName: 'Kuliner', icon: 'Utensils', unit: 'tempat', description: 'Jelajahi tempat makan dan cita rasa lokal Garut.' },
  { slug: 'cafe', name: 'Cafe', shortName: 'Cafe', icon: 'Coffee', unit: 'tempat', description: 'Cari tempat untuk ngopi dan beristirahat.' },
  { slug: 'transportasi', name: 'Rental kendaraan', shortName: 'Rental', icon: 'Car', unit: 'penyedia', description: 'Rental mobil, motor, dan kendaraan rombongan di Garut. Hubungi penyedia untuk tarif dan ketersediaan.' },
  { slug: 'paket-wisata', name: 'Paket wisata', shortName: 'Paket wisata', icon: 'Compass', unit: 'pilihan', description: 'Pilihan perjalanan bersama penyedia lokal.' },
]

export type DirectoryFilters = { query?: string; district?: string; sort?: string }

export function categoryHref(category = '', filters: DirectoryFilters = {}) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.district) params.set('district', filters.district)
  if (filters.sort && filters.sort !== 'relevant') params.set('sort', filters.sort)
  if (!params.size) return category ? `/${category}` : '/search'
  if (category) params.set('category', category)
  return `/search?${params}`
}

export function categoryForQuery(query: string) {
  const term = query.toLocaleLowerCase('id-ID').trim().replace(/\s+/g, ' ').replace(/(?: di)? garut$/, '')
  const aliases: Record<string, string> = {
    wisata: 'wisata', 'tempat wisata': 'wisata', hotel: 'hotel', penginapan: 'hotel',
    kuliner: 'kuliner', 'tempat makan': 'kuliner', cafe: 'cafe', kafe: 'cafe',
    rental: 'transportasi', sewa: 'transportasi', transportasi: 'transportasi',
    'rental kendaraan': 'transportasi', 'sewa kendaraan': 'transportasi',
    'paket wisata': 'paket-wisata',
  }
  return aliases[term]
}
