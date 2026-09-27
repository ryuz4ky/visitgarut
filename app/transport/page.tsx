import type { Metadata } from 'next'
import SimpleLanding from '@/components/SimpleLanding'

export const metadata: Metadata = {
  title: 'Transportasi Garut: Rental Motor, Mobil & Travel',
  description: 'Temukan rental motor, rental mobil, travel, dan pilihan transportasi lokal di Garut.',
  alternates: { canonical: '/transport' },
}

export default function TransportPage() {
  return (
    <SimpleLanding
      eyebrow="MOVE AROUND GARUT"
      title="Keliling Garut lebih mudah."
      description="Direktori transportasi VisitGarut akan membantu wisatawan membandingkan pilihan rental motor, rental mobil, driver, dan travel lokal."
      cards={[
        { eyebrow: 'MOTORBIKE', title: 'Rental Motor', description: 'Pilihan fleksibel untuk eksplorasi kota dan destinasi sekitar.' },
        { eyebrow: 'CAR', title: 'Rental Mobil', description: 'Mobil lepas kunci atau dengan driver untuk keluarga dan grup.' },
        { eyebrow: 'TRAVEL', title: 'Travel & Shuttle', description: 'Temukan transportasi antarkota dan titik keberangkatan menuju Garut.' },
      ]}
    />
  )
}
