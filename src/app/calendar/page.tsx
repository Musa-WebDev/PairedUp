import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { CalendarView } from '@/components/calendar/CalendarView'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>

  const workspaceId = activeWorkspace.id
  const [{ data: entryData }, { data: taskData }, { data: projectData }, { data: goalData }] = await Promise.all([
    supabase.from('calendar_entries').select('id,kind,title,entry_date,entry_time,starts_at,ends_at,status,project_id').eq('workspace_id', workspaceId),
    supabase.from('tasks').select('id,project_id,goal_id').eq('workspace_id', workspaceId),
    supabase.from('projects').select('id,title,status,due_date').eq('workspace_id', workspaceId),
    supabase.from('goals').select('id,title,status,target_date').eq('workspace_id', workspaceId),
  ])

  const entries = (entryData ?? []).filter((entry) => !['completed', 'achieved', 'cancelled'].includes(entry.status))
  const projects = (projectData ?? []).map((project) => ({ id: project.id, title: project.title, status: project.status, dueDate: project.due_date }))
  const goals = (goalData ?? []).map((goal) => ({ id: goal.id, title: goal.title, status: goal.status, dueDate: goal.target_date }))

  return <ProtectedShell><CalendarView entries={entries} taskParents={taskData ?? []} projects={projects} goals={goals} workspaceId={workspaceId}/></ProtectedShell>
}