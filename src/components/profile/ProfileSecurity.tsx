'use client'

import { useActionState, useState } from 'react'
import { requestEmailChangeAction, requestPasswordResetAction, type AccountActionState } from '@/actions/account'

const initialState: AccountActionState = {}
export function ProfileSecurity({ email }: { email: string }) {
  const [emailState, emailAction, emailPending] = useActionState(requestEmailChangeAction, initialState)
  const [resetState, setResetState] = useState<AccountActionState>({})
  const [resetPending, setResetPending] = useState(false)
  async function requestReset() { setResetPending(true); setResetState(await requestPasswordResetAction()); setResetPending(false) }
  return <div className="space-y-6"><section className="rounded-2xl bg-card p-6 shadow-sm"><h2 className="font-bold">Change email</h2><p className="mt-2 text-sm text-muted-foreground">Your current email is <strong>{email}</strong>. We will send confirmation links before applying the change.</p><form action={emailAction} className="mt-5 flex flex-col gap-3 sm:flex-row"><input name="email" type="email" required placeholder="new@email.com" className="h-11 flex-1 rounded-xl border bg-transparent px-3"/><button disabled={emailPending} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{emailPending ? 'Sending…' : 'Change email'}</button></form><Feedback state={emailState} /></section><section className="rounded-2xl bg-card p-6 shadow-sm"><h2 className="font-bold">Password</h2><p className="mt-2 text-sm text-muted-foreground">We will email a secure password-reset link to your current address.</p><button onClick={requestReset} disabled={resetPending} className="mt-5 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{resetPending ? 'Sending…' : 'Send password reset link'}</button><Feedback state={resetState} /></section></div>
}
function Feedback({ state }: { state: AccountActionState }) { if (!state.error && !state.message) return null; return <p className={`mt-3 rounded-xl p-3 text-sm ${state.error ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'}`}>{state.error ?? state.message}</p> }