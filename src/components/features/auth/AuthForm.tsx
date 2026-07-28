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
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20 sm:p-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login' ? 'Sign in to your account to continue' : 'Sign up to start tracking with your partner'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
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
          className="mt-6 w-full bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Spinner className="mr-2" />
          ) : null}
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button 
          onClick={toggleMode}
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
