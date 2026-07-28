'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'

export function GlobalLoadingIndicator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = () => { setLoading(true); if (timeoutRef.current) clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => setLoading(false), 10000) }
  const hide = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setLoading(false) }

  useEffect(() => {
    const timeout = setTimeout(hide, 0)
    return () => clearTimeout(timeout)
  }, [pathname, searchParams])
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as Element | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (link && link.origin === window.location.origin && link.pathname !== window.location.pathname) show()
      const button = target?.closest('button[type="submit"]')
      if (button) show()
    }
    const onSubmit = () => show()
    window.addEventListener('click', onClick, true)
    window.addEventListener('submit', onSubmit, true)
    return () => { window.removeEventListener('click', onClick, true); window.removeEventListener('submit', onSubmit, true); if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  if (!loading) return null
  return <div className="fixed inset-0 z-[100] pointer-events-none" aria-live="polite" aria-label="Loading"><div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-blue-100"><div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500" /></div><div className="absolute right-5 top-5 flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white shadow-lg"><LoaderCircle className="size-4 animate-spin" />Loading</div></div>
}
