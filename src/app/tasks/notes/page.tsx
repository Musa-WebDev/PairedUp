import { createNoteAction } from '@/actions/work'
import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { NoteCard } from '@/components/notes/NoteCard'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>

  const [{ data: notes }, { data: tasks }, { data: projects }] = await Promise.all([
    supabase.from('notes').select('id,title,body,task_id,project_id,created_at').eq('workspace_id', activeWorkspace.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id,title').eq('workspace_id', activeWorkspace.id).neq('status', 'completed'),
    supabase.from('projects').select('id,title').eq('workspace_id', activeWorkspace.id).neq('status', 'completed'),
  ])

  return <ProtectedShell><section className="mx-auto max-w-6xl"><p className="text-sm font-bold text-blue-600">{activeWorkspace.name}</p><h1 className="mt-1 text-3xl font-bold">Notes</h1><div className="mt-7 grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><form action={createNoteAction} className="rounded-2xl bg-card p-5 shadow-sm"><h2 className="font-bold">New note</h2><input type="hidden" name="workspaceId" value={activeWorkspace.id} /><input required name="title" placeholder="Note title" className="mt-4 h-11 w-full rounded-xl border bg-transparent px-3" /><textarea required name="body" placeholder="Write your note..." className="mt-3 min-h-40 w-full rounded-xl border bg-transparent p-3" /><label className="mt-3 block text-xs font-semibold">Attach to task (optional)<select name="taskId" className="mt-1 h-10 w-full rounded-lg border bg-transparent px-2"><option value="">No task</option>{tasks?.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label className="mt-3 block text-xs font-semibold">Attach to project (optional)<select name="projectId" className="mt-1 h-10 w-full rounded-lg border bg-transparent px-2"><option value="">No project</option>{projects?.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><button className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Save note</button></form><div className="grid gap-4 sm:grid-cols-2">{notes?.map((note) => <NoteCard key={note.id} note={note} tasks={tasks ?? []} projects={projects ?? []} />)}{!notes?.length && <p className="text-muted-foreground">No notes yet.</p>}</div></div></section></ProtectedShell>
}
