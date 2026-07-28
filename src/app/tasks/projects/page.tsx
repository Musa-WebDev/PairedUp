import { createProjectAction, createTaskAction } from '@/actions/work'
import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { TaskCard } from '@/components/tasks/TaskCard'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('id,title,description,status,due_date').eq('workspace_id', activeWorkspace.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id,title,status,project_id,due_date,due_time').eq('workspace_id', activeWorkspace.id).order('created_at', { ascending: false }),
  ])

  return <ProtectedShell><section className="mx-auto max-w-7xl"><p className="text-sm font-bold text-blue-600">{activeWorkspace.name}</p><h1 className="mt-1 text-3xl font-bold">Projects & tasks</h1><div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><form action={createProjectAction} className="rounded-2xl bg-card p-5 shadow-sm"><input type="hidden" name="workspaceId" value={activeWorkspace.id} /><h2 className="font-bold">New project</h2><input required name="title" placeholder="Project name" className="mt-4 h-11 w-full rounded-xl border bg-transparent px-3" /><textarea name="description" placeholder="Description" className="mt-3 min-h-24 w-full rounded-xl border bg-transparent p-3" /><input name="dueDate" type="date" className="mt-3 h-11 w-full rounded-xl border bg-transparent px-3" /><button className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Create project</button></form><div className="space-y-4">{projects?.map((project) => <article key={project.id} className="rounded-2xl bg-card p-5 shadow-sm"><h2 className="font-bold">{project.title}</h2><p className="mt-1 text-sm text-muted-foreground">{project.description || 'No description'} {project.due_date && `- Due ${project.due_date}`}</p><form action={createTaskAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"><input type="hidden" name="workspaceId" value={activeWorkspace.id} /><input type="hidden" name="projectId" value={project.id} /><input required name="title" placeholder="Add a task" className="h-10 rounded-xl border bg-transparent px-3" /><input name="dueDate" type="date" max={project.due_date ?? undefined} className="h-10 rounded-xl border bg-transparent px-2 text-sm" /><input name="dueTime" type="time" className="h-10 rounded-xl border bg-transparent px-2 text-sm" /><button className="rounded-xl bg-purple-600 px-3 text-sm font-semibold text-white">Add</button></form><ul className="mt-4 space-y-3">{tasks?.filter((task) => task.project_id === project.id).map((task) => <TaskCard key={task.id} task={task} projectDueDate={project.due_date} />)}</ul></article>)}{!projects?.length && <p className="rounded-2xl bg-card p-6 text-muted-foreground">No projects yet.</p>}</div></div></section></ProtectedShell>
}
