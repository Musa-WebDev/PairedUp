'use client'

import * as React from 'react'
import { Film, Tv, MapPin, ArrowLeft, Plus } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { useAddActivity } from '@/hooks/useAddActivity'
import type { ActivityCategory } from '@/types/activities'

////////////////////////////////////////////////////////////////////////////////
// COMPONENT
////////////////////////////////////////////////////////////////////////////////

export function AddActivityModal() {
  const [open, setOpen] = React.useState(false)
  const { step, form, error, isSubmitting, selectCategory, goBack, resetForm, onSubmit } = useAddActivity(() => setOpen(false))
  const { register, formState: { errors } } = form

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) resetForm()
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Suggestion
        </Button>
      </ModalTrigger>
      
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {step === 1 ? 'What do you want to add?' : 'Add Details'}
          </ModalTitle>
        </ModalHeader>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: CATEGORY SELECTION WIZARD */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-4 py-4">
            <CategoryCard 
              icon={<Film className="h-8 w-8 mb-2" />} 
              label="Movie" 
              onClick={() => selectCategory('movie')} 
            />
            <CategoryCard 
              icon={<Tv className="h-8 w-8 mb-2" />} 
              label="TV Show" 
              onClick={() => selectCategory('show')} 
            />
            <CategoryCard 
              icon={<MapPin className="h-8 w-8 mb-2" />} 
              label="Activity" 
              onClick={() => selectCategory('activity')} 
            />
          </div>
        )}

        {/* STEP 2: DETAILS FORM */}
        {step === 2 && (
          <form onSubmit={onSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Inception, Go Karting" {...register('title')} autoFocus />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes / Description (Optional)</Label>
              <Input id="description" placeholder="Why do you want to do this?" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Link (Optional)</Label>
              <Input id="url" placeholder="IMDB or Booking link" {...register('url')} />
              {errors.url && <p className="text-sm text-red-500">{errors.url.message}</p>}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2" />} Save Suggestion
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}

function CategoryCard({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-black hover:bg-gray-50 dark:hover:border-white dark:hover:bg-gray-900 transition-colors"
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}
