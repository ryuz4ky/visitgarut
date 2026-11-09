import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'VisitGarut', short_name: 'VisitGarut', description: 'Rencanakan kunjungan ke Garut: wisata, penginapan, kuliner, dan usaha lokal.', start_url: '/', display: 'standalone', background_color: '#f4f5ef', theme_color: '#f4f5ef', lang: 'id', icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }, { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' }] }
}
