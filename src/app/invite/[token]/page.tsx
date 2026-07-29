import { acceptInvitationAction } from '@/actions/workspace'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const next = `/invite/${encodeURIComponent(token)}`

  // We can just use a server action that redirects on success.
  // If it throws, Next.js will catch it, but we can make it safer.
  
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-[#0f172a]"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-semibold text-indigo-500">PAIRUP INVITATION</p><h1 className="mt-2 text-2xl font-bold">Join this shared space</h1><p className="mt-3 text-sm text-slate-500">{user ? 'Accept this invitation to add the workspace to your account.' : 'Sign in or create an account, then you will come back here to accept.'}</p>{user ? <form action={acceptInvitationAction.bind(null, token)}><button className="mt-6 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white">Accept invitation</button></form> : <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white">Sign in to continue</Link>}</section></main>
}
