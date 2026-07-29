import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { ProfileIdentity } from '@/components/profile/ProfileIdentity'
import { ProfileSecurity } from '@/components/profile/ProfileSecurity'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).maybeSingle()
    : { data: null }
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Member'

  return (
    <ProtectedShell>
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-bold text-blue-600">ACCOUNT</p>
        <h1 className="mt-1 text-3xl font-bold">Profile settings</h1>
        <div className="mt-8 space-y-6">
          <ProfileIdentity avatarUrl={profile?.avatar_url ?? null} displayName={displayName} userId={user?.id ?? ''} />
          <ProfileSecurity email={user?.email ?? ''} />
        </div>
      </section>
    </ProtectedShell>
  )
}