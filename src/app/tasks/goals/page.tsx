import { createGoalAction } from '@/actions/work'
import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { GoalCard } from '@/components/goals/GoalCard'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { redirect } from 'next/navigation'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeWorkspace } = await getWorkspaceContext()
  if (!activeWorkspace) return <ProtectedShell><p>Create a workspace first.</p></ProtectedShell>

  const [{ data: goals }, { data: tasks }] = await Promise.all([
    supabase.from('goals').select('id,title,description,status,target_date,term,postponement_count').eq('workspace_id', activeWorkspace.id).order('target_date'),
    supabase.from('tasks').select('id,title,status,due_date,goal_id').eq('workspace_id', activeWorkspace.id).order('created_at'),
  ])

  return <ProtectedShell><section className="mx-auto max-w-6xl"><p className="text-sm font-bold text-blue-600">{activeWorkspace.name}</p><h1 className="mt-1 text-3xl font-bold">Goals</h1><div className="mt-7 grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><form action={createGoalAction} className="rounded-2xl bg-card p-5 shadow-sm"><h2 className="font-bold">Create a goal</h2><input type="hidden" name="workspaceId" value={activeWorkspace.id} /><input required name="title" placeholder="Goal title" className="mt-4 h-11 w-full rounded-xl border bg-transparent px-3" /><textarea name="description" placeholder="Description" className="mt-3 min-h-24 w-full rounded-xl border bg-transparent p-3" /><input required name="targetDate" type="date" className="mt-3 h-11 w-full rounded-xl border bg-transparent px-3" /><select name="term" className="mt-3 h-11 w-full rounded-xl border bg-transparent px-3"><option value="short_term">Short term</option><option value="long_term">Long term</option></select><button className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Create goal</button></form><div className="space-y-4">{goals?.map((goal) => <GoalCard key={goal.id} goal={goal} workspaceId={activeWorkspace.id} tasks={tasks?.filter((task) => task.goal_id === goal.id) ?? []} />)}{!goals?.length && <p className="rounded-2xl bg-card p-6 text-muted-foreground">No goals yet.</p>}</div></div></section></ProtectedShell>
}
