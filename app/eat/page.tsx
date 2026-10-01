import type { Metadata } from 'next'
import MarketplaceVertical from '@/components/MarketplaceVertical'

export const metadata: Metadata = {
  title: 'Kuliner Garut: Cafe, Restoran & Oleh-Oleh',
  description: 'Cari cafe, restoran, makanan khas, street food, dan oleh-oleh lokal di Garut berdasarkan area.',
  alternates: { canonical: '/eat' },
}

type EatPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function EatPage({ searchParams }: EatPageProps) {
  const { q = '' } = await searchParams

  return (
    <MarketplaceVertical
      eyebrow="EAT IN GARUT"
      title="Temukan rasa lokal, dari kopi sampai oleh-oleh."
      description="Cari cafe, restoran, makanan khas, street food, dan pusat oleh-oleh. VisitGarut dirancang untuk membantu traveler menemukan tempat makan berdasarkan area dan kebutuhan perjalanan."
      categorySlug="kuliner"
      action="/eat"
      q={q}
      searchPlaceholder="Cari cafe, restoran, makanan khas, atau oleh-oleh..."
      suggestions={[
        { label: 'Cafe & Coffee', description: 'Tempat ngopi dari pusat kota sampai area pegunungan.', href: '/eat?q=cafe' },
        { label: 'Kuliner Khas', description: 'Cari pengalaman makan dan makanan khas Garut.', href: '/eat?q=Garut' },
        { label: 'Oleh-Oleh', description: 'Dodol, produk lokal, dan pusat oleh-oleh untuk dibawa pulang.', href: '/eat?q=oleh-oleh' },
      ]}
      emptyTitle="Direktori kuliner sedang kami isi."
      emptyDescription="Cafe, restoran, street food, dan toko oleh-oleh nantinya dapat memiliki halaman listing sendiri lengkap dengan lokasi, jam buka, kontak, menu highlight, dan tombol direct inquiry."
    />
  )
}
