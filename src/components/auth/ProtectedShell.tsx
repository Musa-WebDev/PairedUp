import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { getWorkspaceContext, getWorkspaceMembers } from '@/lib/workspace-context'

export async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, workspaceContext] = await Promise.all([
    supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).maybeSingle(),
    getWorkspaceContext(),
  ])
  const workspaceMembers = await getWorkspaceMembers(workspaceContext.activeWorkspaceId)
  return (
    <AppShell
      activeWorkspaceId={workspaceContext.activeWorkspaceId}
      displayName={profile?.display_name || user.email?.split('@')[0] || 'Member'}
      email={user.email || ''}
      avatarUrl={profile?.avatar_url ?? null}
      workspaceMembers={workspaceMembers}
      workspaces={workspaceContext.workspaces}
    >
      {children}
    </AppShell>
  )
}
