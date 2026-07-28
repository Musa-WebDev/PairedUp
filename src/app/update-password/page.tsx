'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updatePasswordAction, type AccountActionState } from '@/actions/account'
const initialState: AccountActionState = {}
export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState)
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-[#0f172a]"><form action={action} className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl"><p className="text-sm font-bold text-blue-600">PAIRUP SECURITY</p><h1 className="mt-2 text-2xl font-bold">Set a new password</h1><p className="mt-2 text-sm text-muted-foreground">Choose a strong password with at least eight characters.</p><label className="mt-6 block text-sm font-semibold">New password<input required name="password" type="password" minLength={8} className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3"/></label><label className="mt-4 block text-sm font-semibold">Confirm password<input required name="confirmPassword" type="password" minLength={8} className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3"/></label>{(state.error || state.message) && <p className={`mt-4 rounded-xl p-3 text-sm ${state.error ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>{state.error ?? state.message}</p>}<button disabled={pending} className="mt-6 h-11 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-60">{pending ? 'Updating…' : 'Update password'}</button><Link href="/login" className="mt-4 block text-center text-sm font-semibold text-blue-600">Back to sign in</Link></form></main>
}