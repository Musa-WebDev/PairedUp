import Link from 'next/link'
import { CalendarDays, CirclePlus, FolderKanban, Target } from 'lucide-react'
import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { WorkHierarchy } from '@/components/work/WorkHierarchy'
import { WorkspaceActivityFeed } from '@/components/work/WorkspaceActivityFeed'
import { InviteMember } from '@/components/workspace/InviteMember'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { createWorkspaceAction } from '@/actions/workspace'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { activeWorkspace } = await getWorkspaceContext()

  if (!activeWorkspace) return <ProtectedShell><section className="rounded-2xl bg-card p-8 shadow-sm"><h1 className="text-3xl font-bold">No workspace yet</h1><p className="mt-2 text-muted-foreground">Create one to start collaborating.</p><form action={createWorkspaceAction} className="mt-5 flex max-w-md gap-2"><input required name="name" placeholder="Workspace name" className="h-11 min-w-0 flex-1 rounded-xl border bg-transparent px-3"/><button className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white">Create</button></form></section></ProtectedShell>

  const workspaceId = activeWorkspace.id
  const [{ count: taskCount }, { count: goalCount }, { count: projectCount }, { data: projects }, { data: goals }, { data: tasks }, { data: events }, { data: profiles }] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('status', 'in', '(completed,cancelled)'),
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('status', 'in', '(achieved,cancelled)'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('status', 'in', '(completed,cancelled,archived)'),
    supabase.from('projects').select('id,title,description,status,due_date').eq('workspace_id', workspaceId).not('status', 'in', '(completed,cancelled,archived)').order('due_date'),
    supabase.from('goals').select('id,title,description,status,target_date').eq('workspace_id', workspaceId).not('status', 'in', '(achieved,cancelled)').order('target_date'),
    supabase.from('tasks').select('id,title,status,due_date,due_time,starts_at,created_at,project_id,goal_id').eq('workspace_id', workspaceId).not('status', 'in', '(completed,cancelled)'),
    supabase.from('workspace_events').select('id,actor_id,entity_type,event_type,payload,created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(12),
    supabase.from('profiles').select('id,display_name,avatar_url'),
  ])

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const activityEvents = (events ?? []).map((event) => {
    const actor = event.actor_id ? profileMap.get(event.actor_id) : null
    return { id: event.id, entity_type: event.entity_type, event_type: event.event_type, created_at: event.created_at, payload: (event.payload ?? {}) as { title?: string | null }, actor: actor ? { displayName: actor.display_name || 'Workspace member', avatarUrl: actor.avatar_url ?? null } : null }
  })
  const cards = [
    ['Open tasks', taskCount ?? 0, FolderKanban, 'text-blue-600 bg-blue-50'],
    ['Goals in progress', goalCount ?? 0, Target, 'text-purple-600 bg-purple-50'],
    ['Open projects', projectCount ?? 0, CalendarDays, 'text-rose-600 bg-rose-50'],
  ]

  return <ProtectedShell><div className="mx-auto max-w-7xl space-y-8"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-blue-600">OVERVIEW</p><h1 className="mt-1 text-3xl font-bold">{activeWorkspace.name}</h1><p className="mt-2 text-muted-foreground">Live workspace activity and upcoming commitments.</p></div><Link href="/tasks/projects" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"><CirclePlus className="size-4"/>Create new</Link></section><section className="grid gap-4 md:grid-cols-3">{cards.map(([title, value, Icon, color]) => { const I = Icon as typeof FolderKanban; return <article key={String(title)} className="rounded-2xl bg-card p-5 shadow-sm"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><I className="size-5"/></span><p className="mt-5 text-3xl font-bold">{String(value)}</p><p className="mt-1 text-sm text-muted-foreground">{String(title)}</p></article> })}</section><WorkHierarchy projects={(projects ?? []).map((project) => ({ ...project, dueDate: project.due_date }))} goals={(goals ?? []).map((goal) => ({ ...goal, dueDate: goal.target_date }))} tasks={tasks ?? []}/><WorkspaceActivityFeed events={activityEvents}/><InviteMember workspaceId={workspaceId}/></div></ProtectedShell>
}