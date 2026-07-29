'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { notifyWorkspaceMembers } from '@/lib/notifications/push'

async function context() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}
function text(form: FormData, key: string) { return String(form.get(key) ?? '').trim() }
function refresh() { for (const path of ['/', '/tasks/projects', '/tasks/goals', '/tasks/notes', '/tasks/reminders', '/calendar', '/completed']) revalidatePath(path) }
function actorName(user: { email?: string; user_metadata?: Record<string, unknown> }) { return String(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'A workspace member') }
async function announce(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }, workspaceId: string, verb: string, entity: string, title: string, url: string) { await notifyWorkspaceMembers({ workspaceId, actorId: user.id, title: `${actorName(user)} ${verb} a ${entity}`, body: title, url }) }

export async function createTaskGroupAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'); if (!workspaceId || !title) return
  const { error } = await supabase.from('task_groups').insert({ workspace_id: workspaceId, created_by: user.id, title, type: text(form, 'type') || 'personal_project', icon: text(form, 'icon') || null }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'task group', title, '/tasks'); refresh()
}
export async function createProjectAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'); if (!workspaceId || !title) return
  const { error } = await supabase.from('projects').insert({ workspace_id: workspaceId, created_by: user.id, title, description: text(form, 'description') || null, due_date: text(form, 'dueDate') || null, due_time: text(form, 'dueTime') || null }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'project', title, '/tasks/projects'); refresh()
}
export async function createTaskAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'), projectId = text(form, 'projectId'), goalId = text(form, 'goalId'), taskGroupId = text(form, 'taskGroupId'); if (!workspaceId || !title) return
  const { error } = await supabase.from('tasks').insert({ workspace_id: workspaceId, created_by: user.id, title, project_id: projectId || null, goal_id: goalId || null, task_group_id: taskGroupId || null, due_date: text(form, 'dueDate') || null, due_time: text(form, 'dueTime') || null }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'task', title, '/tasks/projects'); refresh()
}
export async function updateTaskStatusAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'), status = text(form, 'status'); if (!id || !['pending', 'in_progress', 'completed', 'cancelled', 'postponed'].includes(status)) return
  const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'updated', 'task status', `${data.title}: ${status.replace('_', ' ')}`, '/tasks/projects'); refresh()
}
export async function completeTaskAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'); if (!id) return
  const { data, error } = await supabase.from('tasks').update({ status: 'completed' }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'completed', 'task', data.title, '/tasks/projects'); refresh()
}
export async function completeProjectAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'); if (!id) return
  const { data, error } = await supabase.from('projects').update({ status: 'completed' }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'completed', 'project', data.title, '/tasks/projects'); refresh()
}
export async function createGoalAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'), targetDate = text(form, 'targetDate'); if (!workspaceId || !title || !targetDate) return
  const { error } = await supabase.from('goals').insert({ workspace_id: workspaceId, user_id: user.id, created_by: user.id, title, target_date: targetDate, term: text(form, 'term') || 'short_term' }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'goal', title, '/tasks/goals'); refresh()
}
export async function createNoteAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'), taskId = text(form, 'taskId'), projectId = text(form, 'projectId'); if (!workspaceId || !title) return
  const { error } = await supabase.from('notes').insert({ workspace_id: workspaceId, created_by: user.id, title, body: text(form, 'body'), task_id: taskId || null, project_id: taskId ? null : projectId || null }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'note', title, '/tasks/notes'); refresh()
}
export async function updateNoteAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'), title = text(form, 'title'), taskId = text(form, 'taskId'), projectId = text(form, 'projectId'); if (!id || !title) return
  const { data, error } = await supabase.from('notes').update({ title, body: text(form, 'body'), task_id: taskId || null, project_id: taskId ? null : projectId || null }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'updated', 'note', data.title, '/tasks/notes'); refresh()
}
export async function addFeedbackAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), message = text(form, 'message'), taskId = text(form, 'task_id'), projectId = text(form, 'project_id'), goalId = text(form, 'goal_id'), taskGroupId = text(form, 'task_group_id'); if (!workspaceId || !message || (!taskId && !projectId && !goalId && !taskGroupId)) return
  const { error } = await supabase.from('accountability_feedback').insert({ workspace_id: workspaceId, author_id: user.id, message, kind: text(form, 'kind') || 'question', task_id: taskId || null, project_id: projectId || null, goal_id: goalId || null, task_group_id: taskGroupId || null }); if (error) throw new Error(error.message)
  await announce(user, workspaceId, 'added', 'accountability message', message, '/tasks'); refresh()
}

export async function getFeedbacksAction(entityId: string, entityType: 'task_id' | 'project_id' | 'goal_id' | 'task_group_id') {
  const { supabase, user } = await context();
  const { data, error } = await supabase
    .from('accountability_feedback')
    .select('*, profiles!author_id(display_name)')
    .eq(entityType, entityId)
    .order('created_at', { ascending: true })
  
  if (error) throw new Error(error.message)
  return { feedbacks: data || [], currentUserId: user.id }
}
export async function updateTaskScheduleAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'), dueDate = text(form, 'dueDate') || null, dueTime = text(form, 'dueTime') || null; if (!id) return
  const { data, error } = await supabase.from('tasks').update({ due_date: dueDate, due_time: dueTime }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'updated', 'task schedule', data.title, '/calendar'); refresh()
}
export async function updateGoalAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'), status = text(form, 'status'), targetDate = text(form, 'targetDate'); if (!id || !['not_started', 'in_progress', 'achieved', 'postponed', 'cancelled'].includes(status)) return
  const { data: goal, error: readError } = await supabase.from('goals').select('workspace_id,title,target_date').eq('id', id).single(); if (readError || !goal) return
  const effectiveDate = targetDate || goal.target_date; if (!effectiveDate) return
  const { error } = await supabase.from('goals').update({ status, target_date: effectiveDate }).eq('id', id); if (error) throw new Error(error.message)
  await announce(user, goal.workspace_id, 'updated', 'goal status', `${goal.title}: ${status.replace('_', ' ')}`, '/tasks/goals'); refresh()
}
export async function completeGoalAction(form: FormData) {
  const { supabase, user } = await context(); const id = text(form, 'id'); if (!id) return
  const { data, error } = await supabase.from('goals').update({ status: 'achieved' }).eq('id', id).select('workspace_id,title').single(); if (error) throw new Error(error.message)
  await announce(user, data.workspace_id, 'achieved', 'goal', data.title, '/tasks/goals'); refresh()
}
export async function createCalendarEventAction(form: FormData) {
  const { supabase, user } = await context(); const workspaceId = text(form, 'workspaceId'), title = text(form, 'title'), eventKind = text(form, 'eventKind') || 'reminder', date = text(form, 'date'), time = text(form, 'time') || null; if (!workspaceId || !title || !date) return
  if (eventKind === 'project') { const { error } = await supabase.from('projects').insert({ workspace_id: workspaceId, created_by: user.id, title, due_date: date, due_time: time }); if (error) throw new Error(error.message) }
  else if (eventKind === 'goal') { const { error } = await supabase.from('goals').insert({ workspace_id: workspaceId, user_id: user.id, created_by: user.id, title, target_date: date, term: text(form, 'term') || 'short_term' }); if (error) throw new Error(error.message) }
  else if (eventKind === 'task') { const { error } = await supabase.from('tasks').insert({ workspace_id: workspaceId, created_by: user.id, title, due_date: date, due_time: time }); if (error) throw new Error(error.message) }
  else { const { error } = await supabase.from('reminders').insert({ workspace_id: workspaceId, created_by: user.id, title, scheduled_date: date, scheduled_time: time }); if (error) throw new Error(error.message) }
  await announce(user, workspaceId, 'added', eventKind === 'reminder' ? 'reminder' : eventKind, title, eventKind === 'reminder' ? '/tasks/reminders' : '/calendar'); refresh()
}