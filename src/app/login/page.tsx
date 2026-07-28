import { AuthForm } from '@/components/features/auth/AuthForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 dark:bg-[#0f172a] sm:p-6">
      <AuthForm />
    </div>
  )
}
