'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { createTaskGroupAction } from '@/actions/work'
import { FaFilm, FaUtensils, FaPlane, FaBriefcase, FaUser, FaGamepad, FaBook, FaDumbbell, FaMusic, FaHeart, FaHome, FaStar } from 'react-icons/fa'

const ICONS: Record<string, React.ElementType> = {
  FaFilm, FaUtensils, FaPlane, FaBriefcase, FaUser, FaGamepad, 
  FaBook, FaDumbbell, FaMusic, FaHeart, FaHome, FaStar
}

const COMMON_ICONS = Object.keys(ICONS)

export function CreateTaskGroupModal({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [selectedIcon, setSelectedIcon] = React.useState('FaStar')
  const [type, setType] = React.useState('leisure_activity')

  async function handleSubmit(formData: FormData) {
    setPending(true)
    formData.append('workspaceId', workspaceId)
    formData.append('icon', selectedIcon)
    formData.append('type', type)
    await createTaskGroupAction(formData)
    setPending(false)
    setOpen(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Add Task group" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-200 transition-all hover:bg-white/15 hover:text-white">
        <Plus className="size-4 shrink-0" />
        <span>Add Task Group</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button type="button" aria-label="Close modal" onClick={() => !pending && setOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Create New Task Group</h2>
            <p className="mt-2 text-sm text-muted-foreground">Organize your movies, trips, or projects.</p>
            
            <form action={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-muted-foreground mb-1.5">Group Name</label>
                <input id="title" name="title" required placeholder="e.g. Movies, Vacation" autoFocus className="h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Group Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setType('leisure_activity')} className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${type === 'leisure_activity' ? 'bg-blue-600 border-blue-600 text-white' : 'border-border hover:bg-muted text-muted-foreground'}`}>Leisure Activity</button>
                  <button type="button" onClick={() => setType('work_project')} className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${type === 'work_project' ? 'bg-blue-600 border-blue-600 text-white' : 'border-border hover:bg-muted text-muted-foreground'}`}>Work Project</button>
                  <button type="button" onClick={() => setType('personal_project')} className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${type === 'personal_project' ? 'bg-blue-600 border-blue-600 text-white' : 'border-border hover:bg-muted text-muted-foreground'}`}>Personal Project</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Select an Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {COMMON_ICONS.map((iconName) => {
                    const IconComponent = ICONS[iconName]
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`flex justify-center items-center h-10 rounded-xl border transition-colors ${selectedIcon === iconName ? 'bg-blue-600/10 border-blue-600 text-blue-600' : 'border-border hover:bg-muted text-muted-foreground'}`}
                      >
                        <IconComponent className="text-lg" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" disabled={pending} onClick={() => setOpen(false)} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60 text-red-400">Cancel</button>
                <button type="submit" disabled={pending} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                  {pending ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
