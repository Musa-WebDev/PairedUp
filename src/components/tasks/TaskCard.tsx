'use client'

import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { completeTaskAction, updateTaskScheduleAction, updateTaskStatusAction } from '@/actions/work'
import { AccountabilityModal } from '@/components/accountability/AccountabilityModal'

const styles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  postponed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function TaskCard({
  task,
  projectDueDate,
  workspaceId,
}: {
  task: { id: string; title: string; status: string; due_date: string | null; due_time: string | null; workspace_id?: string }
  projectDueDate: string | null
  workspaceId?: string
}) {
  const [editing, setEditing] = useState(false)

  // Use the passed workspaceId or fallback to task's workspace_id if available
  const activeWorkspaceId = workspaceId || task.workspace_id

  return <li className="min-h-24 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{task.title}</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[task.status] ?? styles.pending}`}>{task.status.replace('_', ' ')}</span>{task.due_date && <p className="mt-2 text-xs text-muted-foreground">Due {task.due_date}{task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ''}</p>}</div>{activeWorkspaceId && <AccountabilityModal workspaceId={activeWorkspaceId} entityId={task.id} entityType="task_id" title={task.title} />}{task.status !== 'completed' && <form action={completeTaskAction}><input type="hidden" name="id" value={task.id} /><button title="Mark task completed" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-100"><CheckCircle2 className="size-5" /></button></form>}<button onClick={() => setEditing(!editing)} title="Schedule task" className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"><CalendarDays className="size-5" /></button></div>{editing && <form action={updateTaskScheduleAction} className="mt-4 flex flex-wrap items-end gap-2 border-t pt-3"><input type="hidden" name="id" value={task.id} /><label className="text-xs font-semibold">Date<input name="dueDate" type="date" defaultValue={task.due_date ?? ''} max={projectDueDate ?? undefined} className="mt-1 block h-9 rounded-lg border bg-transparent px-2 text-sm" /></label><label className="text-xs font-semibold">Time<input name="dueTime" type="time" defaultValue={task.due_time ?? ''} className="mt-1 block h-9 rounded-lg border bg-transparent px-2 text-sm" /></label><button className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white">Save</button></form>}<form action={updateTaskStatusAction} className="mt-3"><input type="hidden" name="id" value={task.id} /><select name="status" defaultValue={task.status} className="rounded-lg border bg-transparent px-2 py-1 text-xs"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select><button className="ml-2 text-xs font-semibold text-blue-600">Update status</button></form></li>
}
