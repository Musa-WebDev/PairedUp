import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { CalendarView } from '@/components/calendar/CalendarView'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
export default async function CalendarPage(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect('/login');const {data:m}=await s.from('workspace_members').select('workspace_id').eq('user_id',user.id).limit(1);const w=m?.[0]?.workspace_id;if(!w)return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>;const {data}=await s.from('calendar_entries').select('id,kind,title,entry_date,entry_time,starts_at,ends_at,status').eq('workspace_id',w);return <ProtectedShell><CalendarView entries={data??[]}/></ProtectedShell>}