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

  const { data } = await supabase
    .from('calendar_entries')
    .select('id,kind,title,entry_date,entry_time,starts_at,ends_at,status')
    .eq('workspace_id', activeWorkspace.id)

  return <ProtectedShell><CalendarView entries={data ?? []} /></ProtectedShell>
}
