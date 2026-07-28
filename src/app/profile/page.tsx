import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { ProfileSecurity } from '@/components/profile/ProfileSecurity'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <ProtectedShell><section className="mx-auto max-w-3xl"><p className="text-sm font-bold text-blue-600">ACCOUNT</p><h1 className="mt-1 text-3xl font-bold">Profile settings</h1><div className="mt-8"><ProfileSecurity email={user?.email ?? ''} /></div></section></ProtectedShell>
}