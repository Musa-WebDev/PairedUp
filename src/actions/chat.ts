'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function sendWorkspaceMessageAction(formData: FormData) {
  const { supabase, user } = await currentUser()
  const workspaceId = String(formData.get('workspaceId'))
  const message = String(formData.get('message') ?? '').trim()
  
  if (!workspaceId || !message) return

  const { error } = await supabase
    .from('workspace_messages')
    .insert({
      workspace_id: workspaceId,
      author_id: user.id,
      message
    })

  if (error) throw new Error(error.message)
  
  revalidatePath('/chat')
}
