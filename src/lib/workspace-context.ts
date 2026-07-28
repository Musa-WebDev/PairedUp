import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type WorkspaceOption = {
  id: string
  name: string
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

  const workspaces = (memberships ?? []).flatMap((membership) => {
    const workspace = Array.isArray(membership.workspaces)
      ? membership.workspaces[0]
      : membership.workspaces
    if (!workspace?.id || !workspace?.name) return []
    return [{ id: workspace.id, name: workspace.name, role: membership.role }]
  }) satisfies WorkspaceOption[]

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
