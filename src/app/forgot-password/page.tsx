'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordResetByEmailAction, type AccountActionState } from '@/actions/account'

const initialState: AccountActionState = {}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetByEmailAction, initialState)

  return (
    <main className="grid min-h-screen place-items-center bg-white p-4 dark:bg-[#0f172a]">
      <form action={action} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">PAIRUP SECURITY</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your email and we’ll send you a secure reset link.</p>

        <label className="mt-6 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email address
          <input required name="email" type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-400/20" />
        </label>

        {(state.error || state.message) && (
          <p className={`mt-4 rounded-xl p-3 text-sm ${state.error ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'}`}>
            {state.error ?? state.message}
          </p>
        )}

        <button disabled={pending} className="mt-6 h-11 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
        <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">Back to sign in</Link>
      </form>
    </main>
  )
}