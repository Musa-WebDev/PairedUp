import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { NewReminderForm } from '@/components/forms/NewWorkForms'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id,title,description,scheduled_date,scheduled_time,status')
    .eq('workspace_id', activeWorkspace.id)
    .neq('status', 'cancelled')
    .order('scheduled_date')
    .order('scheduled_time')

  return (
    <ProtectedShell>
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold text-blue-600">REMINDERS</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Calendar reminders</h1>
            <p className="mt-2 text-muted-foreground">Generic events created from the calendar appear here.</p>
          </div>
          <NewReminderForm workspaceId={activeWorkspace.id} />
        </div>

        <div className="mt-7 space-y-3">
          {reminders?.map((reminder) => (
            <article key={reminder.id} className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{reminder.title}</h2>
                  {reminder.description && <p className="mt-1 text-sm text-muted-foreground">{reminder.description}</p>}
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold capitalize text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{reminder.status}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {reminder.scheduled_date}{reminder.scheduled_time ? ` at ${reminder.scheduled_time.slice(0, 5)}` : ''}
              </p>
            </article>
          ))}
          {!reminders?.length && <p className="rounded-2xl bg-card p-6 text-muted-foreground">No reminders yet. Use Add new to create one.</p>}
        </div>
      </section>
    </ProtectedShell>
  )
}