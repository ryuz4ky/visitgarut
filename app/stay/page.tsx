import type { Metadata } from 'next'
import SimpleLanding from '@/components/SimpleLanding'

export const metadata: Metadata = {
  title: 'Hotel & Penginapan di Garut',
  description: 'Temukan hotel, villa, resort, homestay, dan penginapan di Garut untuk berbagai kebutuhan perjalanan.',
  alternates: { canonical: '/stay' },
}

export default function StayPage() {
  return (
    <SimpleLanding
      eyebrow="STAY IN GARUT"
      title="Temukan tempat menginap yang pas."
      description="VisitGarut akan mengumpulkan pilihan hotel, villa, resort, dan homestay berdasarkan area, kebutuhan, dan pengalaman yang kamu cari."
      cards={[
        { eyebrow: 'HOTEL', title: 'Hotel Kota', description: 'Pilihan praktis untuk perjalanan bisnis, keluarga, dan transit.' },
        { eyebrow: 'NATURE', title: 'Villa & Resort', description: 'Menginap dekat pegunungan, air panas, dan suasana alam Garut.' },
        { eyebrow: 'LOCAL', title: 'Homestay', description: 'Pilihan lokal untuk pengalaman yang lebih dekat dengan masyarakat setempat.' },
      ]}
    />
  )
}
