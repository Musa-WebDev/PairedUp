import { AuthForm } from '@/components/features/auth/AuthForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(next?.startsWith('/') && !next.startsWith('//') ? next : '/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 dark:bg-[#0f172a] sm:p-6">
      <AuthForm redirectTo={next} />
    </div>
  )
}
