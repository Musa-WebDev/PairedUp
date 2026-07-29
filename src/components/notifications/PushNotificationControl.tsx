'use client'

import { Bell, BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

export function PushNotificationControl() {
  const [status, setStatus] = useState<'unsupported' | 'idle' | 'enabled' | 'error'>('idle')
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !publicKey) setStatus('unsupported')
  }, [publicKey])

  async function enable() {
    if (status === 'unsupported' || !publicKey) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('error'); return }
      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      const response = await fetch('/api/push-subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscription) })
      if (!response.ok) throw new Error('Unable to save subscription')
      setStatus('enabled')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'unsupported') return null
  return <button type="button" onClick={enable} title={status === 'enabled' ? 'Phone notifications enabled' : 'Enable phone notifications'} className={`grid size-10 place-items-center rounded-full transition ${status === 'enabled' ? 'bg-blue-600 text-white' : 'hover:bg-muted'}`}><span className="sr-only">{status === 'enabled' ? 'Phone notifications enabled' : 'Enable phone notifications'}</span>{status === 'enabled' ? <BellRing className="size-5"/> : <Bell className="size-5"/>}</button>
}