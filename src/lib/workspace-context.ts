import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type WorkspaceOption = {
  id: string
  name: string
  role: string
}

export type WorkspaceMemberOption = {
  id: string
  displayName: string
  avatarUrl: string | null
  role: string
}

export async function getWorkspaceContext() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const selectedWorkspaceId = cookieStore.get('pairup-workspace-id')?.value
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .order('joined_at', { ascending: true })

  // A user may have duplicate membership records from a previous migration or
  // invite. The selector represents workspaces, so keep one entry per workspace.
  const uniqueWorkspaces = new Map<string, WorkspaceOption>()
  for (const membership of memberships ?? []) {
    const workspace = Array.isArray(membership.workspaces)
      ? membership.workspaces[0]
      : membership.workspaces

    if (!workspace?.id || !workspace.name || uniqueWorkspaces.has(workspace.id)) continue
    uniqueWorkspaces.set(workspace.id, {
      id: workspace.id,
      name: workspace.name,
      role: membership.role,
    })
  }

  const workspaces = Array.from(uniqueWorkspaces.values())
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
    workspaces[0] ??
    null

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id ?? null,
  }
}
export async function getWorkspaceMembers(workspaceId: string | null): Promise<WorkspaceMemberOption[]> {
  if (!workspaceId) return []

  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('user_id, role, profiles(id, display_name, avatar_url)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  const uniqueMembers = new Map<string, WorkspaceMemberOption>()
  for (const membership of memberships ?? []) {
    const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles
    if (!profile?.id || uniqueMembers.has(profile.id)) continue
    uniqueMembers.set(profile.id, {
      id: profile.id,
      displayName: profile.display_name || 'Member',
      avatarUrl: profile.avatar_url ?? null,
      role: membership.role,
    })
  }

  return Array.from(uniqueMembers.values())
}