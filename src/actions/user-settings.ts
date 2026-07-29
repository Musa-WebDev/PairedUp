'use server'

import { createClient } from '@/lib/supabase/server'

////////////////////////////////////////////////////////////////////////////////
// USER SETTINGS ACTIONS
////////////////////////////////////////////////////////////////////////////////

/**
 * Triggers the "Reset Password" email for the currently signed-in user.
 * Note: If you want to use the custom React Email template, you must configure
 * Resend as the SMTP provider in your Supabase Dashboard and paste the compiled HTML there.
 */
export async function requestPasswordResetAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Not authenticated or no email found' }
  }

  // Supabase automatically generates the secure token and sends the email
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Triggers the "Change Email Address" email flow for the currently signed-in user.
 */
export async function requestEmailChangeAction(newEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Supabase automatically sends confirmation emails to both the old and new addresses
  const { error } = await supabase.auth.updateUser({ email: newEmail })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
