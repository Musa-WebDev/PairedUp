import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { TaskCard } from '@/components/tasks/TaskCard'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createTaskAction } from '@/actions/work'
import * as FaIcons from 'react-icons/fa'

import { AccountabilityChat } from '@/components/accountability/AccountabilityChat'

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

  // Fetch the specific task group
  const { data: group } = await supabase
    .from('task_groups')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', activeWorkspace.id)
    .single()

  if (!group) {
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
    .select('id, title, status, task_group_id, due_date, due_time')
    .eq('task_group_id', id)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })

  // Fetch accountability feedback
  const { data: feedbacks } = await supabase
    .from('accountability_feedback')
    .select('*, profiles!author_id(display_name)')
    .eq('task_group_id', id)
    .order('created_at', { ascending: true })

  const IconComponent = group.icon && (FaIcons as any)[group.icon] ? (FaIcons as any)[group.icon] : null

  return (
    <ProtectedShell>
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-1">
            {IconComponent && <IconComponent className="text-blue-600 size-5" />}
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">
              {group.type ? group.type.replace('_', ' ') : 'Task Group'}
            </p>
          </div>
          <h1 className="text-3xl font-bold">{group.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 mt-2 rounded-2xl bg-card p-5 shadow-sm">
            <form action={createTaskAction} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <input type="hidden" name="workspaceId" value={activeWorkspace.id}/>
              <input type="hidden" name="taskGroupId" value={group.id}/>
              <input required name="title" placeholder="Add a new task or item..." className="h-10 rounded-xl border bg-transparent px-3"/>
              <input name="dueDate" type="date" className="h-10 rounded-xl border bg-transparent px-2 text-sm"/>
              <input name="dueTime" type="time" className="h-10 rounded-xl border bg-transparent px-2 text-sm"/>
              <button className="rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-500 transition-colors">Add</button>
            </form>

            <ul className="mt-8 space-y-3">
              {tasks?.map((task) => (
                <TaskCard key={task.id} task={task} projectDueDate={null}/>
              ))}
              {!tasks?.length && (
                <li className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl">
                  No items added yet.
                </li>
              )}
            </ul>
          </div>

          <div className="mt-2">
            <AccountabilityChat 
              workspaceId={activeWorkspace.id}
              entityId={group.id}
              entityType="task_group_id"
              feedbacks={feedbacks || []}
              currentUserId={user.id}
            />
          </div>
        </div>
      </section>
    </ProtectedShell>
  )
}
