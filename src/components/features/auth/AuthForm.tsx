'use client'

import { useAuthForm } from '@/hooks/useAuthForm'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'

////////////////////////////////////////////////////////////////////////////////
// COMPONENT
////////////////////////////////////////////////////////////////////////////////

export function AuthForm() {
  const { mode, toggleMode, form, error, isSubmitting, onSubmit } = useAuthForm()
  const { register, formState: { errors } } = form

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {mode === 'login' ? 'Sign in to your account to continue' : 'Sign up to start tracking with your partner'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              placeholder="e.g. John" 
              {...register('displayName')} 
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@example.com" 
            {...register('email')} 
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            {...register('password')} 
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Spinner className="mr-2" />
          ) : null}
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button 
          onClick={toggleMode}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
