import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Kuliner Garut: Cafe, Restoran & Oleh-Oleh',
  description: 'Cari cafe, restoran, makanan khas, street food, dan oleh-oleh lokal di Garut berdasarkan area.',
  alternates: { canonical: '/eat' },
}

type EatPageProps = {
  searchParams: Promise<{ q?: string; subtype?: string; district?: string; verified?: string; amenity?: string; price?: string; sort?: string; page?: string }>
}

export default async function EatPage({ searchParams }: EatPageProps) {
  const { q = '', subtype = '', district = '', verified = '', amenity = '', price = '', sort = '', page = '' } = await searchParams

  return (
    <MarketplaceVertical
      eyebrow="EAT IN GARUT"
      title="Temukan rasa lokal, dari kopi sampai oleh-oleh."
      description="Cari cafe, restoran, makanan khas, street food, dan pusat oleh-oleh berdasarkan area, tipe, sumber verifikasi, serta inventory yang tersedia."
      categorySlug="kuliner"
      action="/eat"
      q={q}
      filters={{ subtype, district, verified, amenity, price, sort, page }}
      searchPlaceholder="Cari cafe, restoran, makanan khas, atau oleh-oleh..."
      suggestions={[
        { label: 'Cafe & Coffee', description: 'Tempat ngopi dari pusat kota sampai area pegunungan.', href: '/eat?q=cafe' },
        { label: 'Kuliner Khas', description: 'Cari pengalaman makan dan makanan khas Garut.', href: '/eat?q=Garut' },
        { label: 'Source Verified', description: 'Prioritaskan listing dengan sumber data yang dapat dilacak.', href: '/eat?verified=1' },
      ]}
      emptyTitle="Belum ada kuliner yang cocok."
      emptyDescription="Cafe, restoran, street food, dan toko oleh-oleh akan terus ditambahkan dengan lokasi, jam buka, sumber data, dan item/menu yang dapat dipilih."
    />
  )
}
