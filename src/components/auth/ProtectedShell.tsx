import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

export async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
  return <AppShell displayName={profile?.display_name || user.email?.split('@')[0] || 'Member'} email={user.email || ''}>{children}</AppShell>
}