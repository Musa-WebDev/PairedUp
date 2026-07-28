'use server'

import { createHash, randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createWorkspaceAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const { error } = await supabase.rpc('create_workspace', { workspace_name: name })
  if (error) throw new Error(error.message)
  revalidatePath('/')
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
  redirect(`/?invite=${encodeURIComponent(`/invite/${token}`)}`)
}

export async function acceptInvitationAction(token: string) {
  const { supabase } = await currentUser()
  const { error } = await supabase.rpc('accept_workspace_invitation', { invite_token: token })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  redirect('/')
}