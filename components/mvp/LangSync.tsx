'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Keeps <html lang> right on client-side navigation between Indonesian pages and the English section (/en).
 * The first paint of /en pages is set by the inline script in app/en/layout.tsx. */
export const langFor = (path: string) => (path === '/en' || path.startsWith('/en/') ? 'en' : 'id')

export default function LangSync() {
  const path = usePathname() || '/'
  useEffect(() => { document.documentElement.lang = langFor(path) }, [path])
  return null
}
