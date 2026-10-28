'use client'
export default function PrintButton() {
  return <button type="button" className="vg-button" onClick={() => window.print()}>Cetak</button>
}
