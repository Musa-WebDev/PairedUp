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

export function useAuthForm(initialMode: AuthMode = 'login') {
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
        ? await loginAction(data) 
        : await signupAction(data)
        
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
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
