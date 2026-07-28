'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { completeGoalAction, createTaskAction, updateGoalAction } from '@/actions/work'
import { TaskCard } from '@/components/tasks/TaskCard'

const pill: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  achieved: 'bg-emerald-100 text-emerald-700',
  postponed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function GoalCard({
  goal,
  workspaceId,
  tasks,
}: {
  goal: { id: string; title: string; description: string | null; status: string; target_date: string; term: string; postponement_count: number }
  workspaceId: string
  tasks: { id: string; title: string; status: string; due_date: string | null; due_time: string | null }[]
}) {
  const [status, setStatus] = useState(goal.status)

  return <article className="rounded-2xl bg-card p-5 shadow-sm"><div className="flex justify-between gap-4"><div><h2 className="font-bold">{goal.title}</h2><p className="mt-1 text-sm text-muted-foreground">{goal.description}</p><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${pill[goal.status]}`}>{goal.status.replace('_', ' ')}</span></div><div className="text-right text-sm"><p className="font-semibold">Due {goal.target_date}</p><p className="text-xs text-muted-foreground">{goal.term.replace('_', ' ')} - {goal.postponement_count}/3 postponements</p></div></div><div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4"><form action={completeGoalAction}><input type="hidden" name="id" value={goal.id} /><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white"><CheckCircle2 className="size-4" />Complete</button></form><form action={updateGoalAction} className="flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={goal.id} /><label className="text-xs font-semibold">Status<select name="status" value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block h-10 rounded-lg border bg-transparent px-2"><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="achieved">Achieved</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select></label>{status === 'postponed' && <label className="text-xs font-semibold">Postpone to<input required name="targetDate" type="date" min={goal.target_date} className="mt-1 block h-10 rounded-lg border bg-transparent px-2" /></label>}<button className="h-10 rounded-lg border px-3 text-sm font-semibold">Save</button></form></div><div className="mt-4 border-t pt-4"><h3 className="text-sm font-bold">Steps to achieve this goal</h3><form action={createTaskAction} className="mt-3 flex gap-2"><input type="hidden" name="workspaceId" value={workspaceId} /><input type="hidden" name="goalId" value={goal.id} /><input type="hidden" name="dueDate" value={goal.target_date} /><input required name="title" placeholder="Add a step" className="h-10 flex-1 rounded-lg border bg-transparent px-3 text-sm" /><button className="rounded-lg bg-purple-600 px-3 text-sm font-semibold text-white">Add</button></form><ul className="mt-3 space-y-2">{tasks.map((task) => <TaskCard key={task.id} task={task} projectDueDate={goal.target_date} />)}{!tasks.length && <li className="text-sm text-muted-foreground">No steps yet.</li>}</ul></div></article>
}
