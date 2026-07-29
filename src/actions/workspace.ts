'use server'

import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { notifyWorkspaceMembers } from '@/lib/notifications/push'
import { sendEmail } from '@/services/email.service'
import WorkspaceInviteEmail from '@/emails/WorkspaceInviteEmail'
import React from 'react'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createWorkspaceAction(formData: FormData) {
  const { supabase } = await currentUser()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const { data, error } = await supabase.rpc('create_workspace', { workspace_name: name })
  if (error) throw new Error(error.message)
  if (data) {
    const cookieStore = await cookies()
    cookieStore.set('pairup-workspace-id', data, { path: '/', sameSite: 'lax' })
  }
  revalidatePath('/')
}

export async function setActiveWorkspaceAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const workspaceId = String(formData.get('workspaceId') ?? '')
  if (!workspaceId) return
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data) return
  const cookieStore = await cookies()
  cookieStore.set('pairup-workspace-id', workspaceId, { path: '/', sameSite: 'lax' })
  revalidatePath('/')
  revalidatePath('/tasks/projects')
  revalidatePath('/tasks/goals')
  revalidatePath('/tasks/notes')
  revalidatePath('/calendar')
}

export async function addActivityAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const workspaceId = String(formData.get('workspaceId'))
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? 'activity')
  const description = String(formData.get('description') ?? '').trim() || null
  if (!workspaceId || !title || !['movie', 'show', 'activity'].includes(category)) return
  const { error } = await supabase.from('activities').insert({ workspace_id: workspaceId, created_by: user.id, title, description, category })
  if (error) throw new Error(error.message)
  await notifyWorkspaceMembers({ workspaceId, actorId: user.id, title: `${user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'A workspace member'} added an activity`, body: title, url: '/' })
  revalidatePath('/')
}

export async function addGoalAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const workspaceId = String(formData.get('workspaceId'))
  const title = String(formData.get('title') ?? '').trim()
  const targetDate = String(formData.get('targetDate') ?? '') || null
  if (!workspaceId || !title) return
  const { error } = await supabase.from('goals').insert({ workspace_id: workspaceId, user_id: user.id, created_by: user.id, title, target_date: targetDate })
  if (error) throw new Error(error.message)
  await notifyWorkspaceMembers({ workspaceId, actorId: user.id, title: `${user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'A workspace member'} added a goal`, body: title, url: '/tasks/goals' })
  revalidatePath('/')
}

export async function createInvitationAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const workspaceId = String(formData.get('workspaceId'))
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!workspaceId || !email) return
  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const { error } = await supabase.from('workspace_invitations').insert({ workspace_id: workspaceId, email, token_hash: tokenHash, invited_by: user.id })
  if (error) throw new Error(error.message)

  // Get workspace and inviter info for the email
  const [{ data: workspace }, { data: inviter }] = await Promise.all([
    supabase.from('workspaces').select('name').eq('id', workspaceId).single(),
    supabase.from('profiles').select('display_name').eq('id', user.id).single()
  ])

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${token}`

  // Send the email
  const emailResult = await sendEmail({
    to: email,
    subject: `You've been invited to join ${workspace?.name || 'a workspace'}`,
    reactComponent: React.createElement(WorkspaceInviteEmail, {
      inviterName: inviter?.display_name || user.email?.split('@')[0] || 'Someone',
      workspaceName: workspace?.name || 'a workspace',
      inviteLink: inviteLink
    })
  })

  if (!emailResult.success) {
    throw new Error(`Failed to send invitation email: ${emailResult.error?.message || 'Unknown error'}`)
  }

  // Do not redirect to the invite link for the inviter! Instead just return to refresh the UI.
  revalidatePath('/')
}

export async function acceptInvitationAction(token: string) {
  const { supabase } = await currentUser()
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const { data, error } = await supabase.rpc('accept_workspace_invitation', { invite_token: tokenHash })
  if (error) throw new Error(error.message)
  if (data) {
    const cookieStore = await cookies()
    cookieStore.set('pairup-workspace-id', data, { path: '/', sameSite: 'lax' })
  }
  revalidatePath('/')
  redirect('/')
}

export type WorkspaceMemberActionState = { error?: string; message?: string }

export async function removeWorkspaceMemberAction(workspaceId: string, memberId: string): Promise<WorkspaceMemberActionState> {
  const { supabase, user } = await currentUser()
  if (!workspaceId || !memberId) return { error: 'Invalid workspace member.' }
  if (memberId === user.id) return { error: 'Use a leave-workspace action to remove yourself.' }

  const [{ data: actorMembership }, { data: targetMembership }] = await Promise.all([
    supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).maybeSingle(),
    supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', memberId).maybeSingle(),
  ])

  if (!actorMembership || !['owner', 'admin'].includes(actorMembership.role)) {
    return { error: 'Only workspace owners and admins can remove members.' }
  }
  if (!targetMembership) return { error: 'This member is no longer linked to the workspace.' }
  if (targetMembership.role === 'owner') return { error: 'The workspace owner cannot be removed.' }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberId)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { message: 'Member removed from the workspace.' }
}