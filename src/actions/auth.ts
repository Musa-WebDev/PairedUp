'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AuthInput } from '@/types/auth'

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

export async function loginAction(data: AuthInput) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signupAction(data: AuthInput) {
  const supabase = await createClient()
  
  if (!data.displayName) {
    return { error: 'Display name is required for signup' }
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}
