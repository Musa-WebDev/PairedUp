'use client'

import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { updateNoteAction } from '@/actions/work'

type Note = {
  id: string
  title: string
  body: string
  task_id: string | null
  project_id: string | null
}

type LinkableItem = {
  id: string
  title: string
}

export function NoteCard({
  note,
  projects,
  tasks,
}: {
  note: Note
  projects: LinkableItem[]
  tasks: LinkableItem[]
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return <article className="rounded-2xl bg-card p-5 shadow-sm"><form action={updateNoteAction} className="space-y-3"><input type="hidden" name="id" value={note.id} /><div className="flex items-center gap-2"><input required name="title" defaultValue={note.title} className="h-11 min-w-0 flex-1 rounded-xl border bg-transparent px-3 font-semibold" /><button type="button" onClick={() => setEditing(false)} title="Cancel editing" className="rounded-lg border p-2"><X className="size-4" /></button></div><textarea required name="body" defaultValue={note.body} className="min-h-44 w-full rounded-xl border bg-transparent p-3 text-sm" /><label className="block text-xs font-semibold">Attach to task<select name="taskId" defaultValue={note.task_id ?? ''} className="mt-1 h-10 w-full rounded-lg border bg-transparent px-2"><option value="">No task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label className="block text-xs font-semibold">Attach to project<select name="projectId" defaultValue={note.project_id ?? ''} className="mt-1 h-10 w-full rounded-lg border bg-transparent px-2"><option value="">No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Save changes</button></form></article>
  }

  return <article className="rounded-2xl bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 className="font-bold">{note.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p></div><button onClick={() => setEditing(true)} title="Edit note" className="rounded-lg border p-2 text-blue-600 hover:bg-blue-50"><Pencil className="size-4" /></button></div>{(note.task_id || note.project_id) && <p className="mt-4 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">Attached to {note.task_id ? 'task' : 'project'}</p>}</article>
}
