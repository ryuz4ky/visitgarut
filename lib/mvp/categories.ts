export const categories = [
  { slug: 'wisata', name: 'Wisata', shortName: 'Wisata', icon: 'Mountain', unit: 'tempat', seoDescription: 'Daftar tempat wisata di Garut: gunung, kawah, danau, curug, dan pantai, lengkap dengan lokasi, tiket bersumber, dan tanggal pemeriksaan.', description: 'Gunung, danau, pantai, dan pengalaman alam di Garut.' },
  { slug: 'hotel', name: 'Hotel', shortName: 'Hotel', icon: 'BedDouble', unit: 'tempat', seoDescription: 'Hotel, resor, dan penginapan di Garut dengan lokasi, fasilitas, dan sumber informasi yang bisa diperiksa sebelum memesan.', description: 'Temukan penginapan untuk perjalananmu.' },
  { slug: 'kuliner', name: 'Kuliner', shortName: 'Kuliner', icon: 'Utensils', unit: 'tempat', seoDescription: 'Rumah makan dan kuliner khas Sunda di Garut, lengkap dengan lokasi, kontak, dan informasi yang bisa diperiksa sebelum datang.', description: 'Jelajahi tempat makan dan cita rasa lokal Garut.' },
  { slug: 'cafe', name: 'Cafe', shortName: 'Cafe', icon: 'Coffee', unit: 'tempat', seoDescription: 'Cafe dan tempat ngopi di Garut untuk santai atau bekerja, lengkap dengan lokasi, kontak, dan informasi kunjungan.', description: 'Cari tempat untuk ngopi dan beristirahat.' },
  { slug: 'transportasi', name: 'Rental kendaraan', shortName: 'Rental', icon: 'Car', unit: 'penyedia', seoDescription: 'Rental mobil, motor, dan kendaraan rombongan di Garut. Bandingkan penyedia, lalu konfirmasi tarif dan ketersediaan langsung.', description: 'Rental mobil, motor, dan kendaraan rombongan di Garut. Hubungi penyedia untuk tarif dan ketersediaan.' },
  { slug: 'paket-wisata', name: 'Paket wisata', shortName: 'Paket wisata', icon: 'Compass', unit: 'pilihan', seoDescription: 'Paket wisata di Garut bersama penyedia lokal: pilihan perjalanan, cakupan layanan, dan kontak penyedia.', description: 'Pilihan perjalanan bersama penyedia lokal.' },
  { slug: 'oleh-oleh', name: 'Oleh-oleh & UMKM', shortName: 'Oleh-oleh', icon: 'ShoppingBag', unit: 'usaha', seoDescription: 'Toko oleh-oleh dan UMKM Garut: dodol, kerajinan kulit Sukaregang, batik Garutan, dan produk lokal lainnya.', description: 'Dodol, kerajinan kulit Sukaregang, batik Garutan, dan produk lokal lainnya.' },
  { slug: 'jasa', name: 'Jasa lokal', shortName: 'Jasa', icon: 'Wrench', unit: 'usaha', seoDescription: 'Jasa lokal di Garut seperti bengkel, laundry, dan salon yang melayani warga dan pendatang.', description: 'Bengkel, laundry, salon, dan jasa lain yang melayani warga dan pendatang.' },
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
    'oleh-oleh': 'oleh-oleh', 'oleh oleh': 'oleh-oleh', umkm: 'oleh-oleh', dodol: 'oleh-oleh',
    jasa: 'jasa', bengkel: 'jasa', laundry: 'jasa', salon: 'jasa',
  }
  return aliases[term]
}
