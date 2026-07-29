'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateActivityInput, ActivityStatus } from '@/types/activities'

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

export async function getActivities() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      profiles:created_by (display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createActivityAction(input: CreateActivityInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('activities')
    .insert({
      created_by: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      url: input.url,
      status: 'suggested'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateActivityStatusAction(id: string, status: ActivityStatus) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('activities')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteActivityAction(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
