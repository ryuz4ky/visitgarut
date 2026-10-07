'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="vg-wrap vg-section"><h1>Halaman belum dapat dimuat.</h1><p>Coba muat ulang beberapa saat lagi.</p><button className="vg-button" onClick={reset}>Coba lagi</button></main>}
