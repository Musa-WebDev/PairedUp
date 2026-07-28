import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthSchema, type AuthInput } from '@/types/auth'
import { loginAction, signupAction } from '@/actions/auth'

////////////////////////////////////////////////////////////////////////////////
// TYPES & ENUMS
////////////////////////////////////////////////////////////////////////////////

export type AuthMode = 'login' | 'signup'

////////////////////////////////////////////////////////////////////////////////
// HOOK
////////////////////////////////////////////////////////////////////////////////

export function useAuthForm(initialMode: AuthMode = 'login', redirectTo?: string | null) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AuthInput>({
    resolver: zodResolver(AuthSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  })

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
    setError(null)
    form.reset()
  }

  const onSubmit = async (data: AuthInput) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = mode === 'login' 
        ? await loginAction(data, redirectTo) 
        : await signupAction(data, redirectTo)
        
      if (result?.error) {
        setError(result.error)
      } else if (result && 'requiresEmailConfirmation' in result && result.requiresEmailConfirmation) {
        const nextParam = result.redirectTo ? `&next=${encodeURIComponent(result.redirectTo)}` : ''
        router.push(`/check-email?email=${encodeURIComponent(data.email)}${nextParam}`)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mode,
    toggleMode,
    form,
    error,
    isSubmitting,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
