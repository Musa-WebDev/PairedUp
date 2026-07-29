'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function AvatarPreview({ displayName, src }: { displayName: string; src: string }) {
  if (src) {
    return <img src={src} alt={`${displayName}'s profile photo`} className="size-24 rounded-full border-4 border-white object-cover shadow-sm dark:border-slate-800" />
  }

  return <span className="grid size-24 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-blue-600 to-purple-600 text-3xl font-bold text-white shadow-sm dark:border-slate-800">{displayName.slice(0, 1).toUpperCase()}</span>
}

export function ProfileIdentity({ avatarUrl, displayName, userId }: { avatarUrl: string | null; displayName: string; userId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(avatarUrl ?? '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  function selectFile(file: File | undefined) {
    setError('')
    setMessage('')
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Your image must be 5 MB or smaller.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadPhoto() {
    if (!selectedFile) return
    setPending(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() || 'image'
    const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(objectPath, selectedFile, {
      cacheControl: '3600',
      contentType: selectedFile.type,
    })

    if (uploadError) {
      setPending(false)
      setError(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(objectPath)
    const storedUrl = publicUrlData.publicUrl
    const { error: profileError } = await supabase.from('profiles').update({ avatar_url: storedUrl }).eq('id', userId)

    setPending(false)
    if (profileError) {
      setError(profileError.message)
      return
    }

    if (avatarUrl) {
      const previousPath = new URL(avatarUrl).pathname.split('/avatars/')[1]
      if (previousPath) await supabase.storage.from('avatars').remove([previousPath])
    }

    setPreviewUrl(storedUrl)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMessage('Profile photo updated.')
    router.refresh()
  }

  async function removePhoto() {
    setPending(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: profileError } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)

    if (profileError) {
      setPending(false)
      setError(profileError.message)
      return
    }

    await supabase.storage.from('avatars').remove([`${userId}/avatar`])
    setPreviewUrl('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setPending(false)
    setMessage('Profile photo removed.')
    router.refresh()
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-bold">Profile photo</h2>
      <p className="mt-2 text-sm text-muted-foreground">Upload a JPG, PNG, or WebP image from your device. Maximum file size: 5 MB.</p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <AvatarPreview displayName={displayName} src={previewUrl} />
        <div className="flex flex-wrap gap-3">
          <input ref={fileInputRef} id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
          <label htmlFor="avatar-file" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted">
            <Camera className="size-4" />
            Choose image
          </label>
          <button type="button" onClick={uploadPhoto} disabled={!selectedFile || pending} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {pending && selectedFile ? 'Uploading…' : 'Upload photo'}
          </button>
          {avatarUrl && (
            <button type="button" onClick={removePhoto} disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
              <Trash2 className="size-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {selectedFile && <p className="mt-4 text-sm text-muted-foreground">Ready to upload: {selectedFile.name}</p>}
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
      {message && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{message}</p>}
    </section>
  )
}