'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type AccountActionState = { error?: string; message?: string }

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Your session has expired. Please sign in again.' }
  return { supabase, user, error: null }
}

function getAppUrl(headerList: Headers) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const protocol = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export async function requestEmailChangeAction(_: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Enter a valid email address.' }
  const { supabase, user, error: authError } = await authenticatedClient()
  if (authError || !user) return { error: authError }
  if (email === user.email) return { error: 'That is already your current email address.' }
  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: error.message }
  return { message: 'Confirmation links have been sent. Confirm the change from your email inbox.' }
}

export async function requestPasswordResetAction(): Promise<AccountActionState> {
  const { supabase, user, error: authError } = await authenticatedClient()
  if (authError || !user?.email) return { error: authError ?? 'Your session has expired. Please sign in again.' }
  const appUrl = getAppUrl(await headers())
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${appUrl}/update-password` })
  if (error) return { error: error.message }
  return { message: 'Password reset link sent. Check your email to continue.' }
}

export async function updatePasswordAction(_: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  if (password.length < 8) return { error: 'Your password must be at least 8 characters.' }
  if (password !== confirmPassword) return { error: 'Passwords do not match.' }
  const { supabase, user, error: authError } = await authenticatedClient()
  if (authError || !user) return { error: authError ?? 'Open the recovery link from your email first.' }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { message: 'Password updated successfully. You can now sign in with your new password.' }
}