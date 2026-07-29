import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateActivitySchema, type CreateActivityInput, type ActivityCategory } from '@/types/activities'
import { createActivityAction } from '@/actions/activities'

////////////////////////////////////////////////////////////////////////////////
// HOOK
////////////////////////////////////////////////////////////////////////////////

export function useAddActivity(onSuccess?: () => void) {
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(CreateActivitySchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'movie', // Default, will be overwritten by step 1
      url: '',
    },
  })

  const selectCategory = (category: ActivityCategory) => {
    form.setValue('category', category)
    setStep(2) // Auto-advance to step 2
  }

  const goBack = () => {
    setStep(1)
  }

  const onSubmit = async (data: CreateActivityInput) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await createActivityAction(data)
      if (result?.error) {
        setError(result.error)
      } else {
        form.reset()
        setStep(1)
        onSuccess?.()
      }
    } catch (err) {
      setError('Failed to add activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    form.reset()
    setStep(1)
    setError(null)
  }

  return {
    step,
    form,
    error,
    isSubmitting,
    selectCategory,
    goBack,
    resetForm,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
