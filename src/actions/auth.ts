'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AuthInput } from '@/types/auth'

function safeRedirectPath(path?: string | null) {
  if (!path?.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

export async function loginAction(data: AuthInput, redirectTo?: string | null) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect(safeRedirectPath(redirectTo))
}

export async function signupAction(data: AuthInput, redirectTo?: string | null) {
  const supabase = await createClient()
  
  if (!data.displayName) {
    return { error: 'Display name is required for signup' }
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
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

  if (!signUpData.session) {
    return { requiresEmailConfirmation: true, redirectTo: safeRedirectPath(redirectTo) }
  }

  redirect(safeRedirectPath(redirectTo))
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
