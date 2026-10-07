import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
export default function NotFound(){return <Shell><section className="vg-wrap vg-section vg-empty"><h1>Halaman tidak ditemukan</h1><p>Tempat atau artikel ini belum tersedia.</p><Link className="vg-button" href="/search">Jelajahi Garut</Link></section></Shell>}
