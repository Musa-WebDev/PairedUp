import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TaskGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) {
    return (
      <ProtectedShell>
        <p>Create a workspace first.</p>
      </ProtectedShell>
    )
  }

  // Fetch the specific project/task group
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, description, status, due_date, type, icon')
    .eq('id', id)
    .eq('workspace_id', activeWorkspace.id)
    .single()

  if (!project) {
    return (
      <ProtectedShell>
        <section className="mx-auto max-w-7xl text-center py-20">
          <h1 className="text-2xl font-bold">Task Group not found</h1>
          <p className="mt-2 text-muted-foreground">It may have been deleted or archived.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </section>
      </ProtectedShell>
    )
  }

  // Fetch its tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, project_id, due_date, due_time')
    .eq('project_id', id)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })

  return (
    <ProtectedShell>
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">
            {project.type ? project.type.replace('_', ' ') : 'Task Group'}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          )}
        </div>

        <div className="mt-8">
          <ProjectCard 
            project={project} 
            workspaceId={activeWorkspace.id} 
            tasks={tasks || []} 
            initiallyOpen={true}
          />
        </div>
      </section>
    </ProtectedShell>
  )
}
