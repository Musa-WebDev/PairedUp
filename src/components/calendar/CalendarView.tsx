'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { createCalendarEventAction } from '@/actions/work'

type Entry = { id: string; kind: string; title: string; entry_date: string | null; entry_time: string | null; starts_at: string | null; ends_at: string | null; status: string; project_id: string | null }
type TaskParent = { id: string; project_id: string | null; goal_id: string | null }
type Parent = { id: string; title: string; status: string; dueDate: string | null }
type View = 'month' | 'week' | 'day'

const colors: Record<string, string> = { task: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', goal: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300', project: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', note: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200', reminder: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' }
const iso = (date: Date) => date.toISOString().slice(0, 10)
const entryDate = (entry: Entry) => entry.entry_date ?? entry.starts_at?.slice(0, 10) ?? null
const entryTimestamp = (entry: Entry) => `${entryDate(entry) ?? '9999-12-31'}T${entry.entry_time ?? entry.starts_at?.slice(11, 19) ?? '23:59:59'}`

function EventSubmitButton() {
  const { pending } = useFormStatus()
  return <button className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60" disabled={pending}>{pending ? 'Adding…' : 'Add event'}</button>
}

function HierarchyList({ entries = [], projects = [], goals = [], taskParents = [] }: { entries?: Entry[]; projects?: Parent[]; goals?: Parent[]; taskParents?: TaskParent[] }) {
  const taskMap = new Map(taskParents.map((task) => [task.id, task]))
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]))
  const grouped = new Map<string, { parent: Parent; kind: 'project' | 'goal'; children: Entry[]; parentEntry?: Entry }>()
  const standalone: Entry[] = []

  for (const entry of [...entries].sort((a, b) => entryTimestamp(a).localeCompare(entryTimestamp(b)))) {
    const task = entry.kind === 'task' ? taskMap.get(entry.id) : undefined
    const projectId = entry.kind === 'project' ? entry.id : task?.project_id
    const goalId = entry.kind === 'goal' ? entry.id : task?.goal_id
    const parent = projectId ? projectMap.get(projectId) : goalId ? goalMap.get(goalId) : undefined
    const kind = projectId ? 'project' : goalId ? 'goal' : undefined

    if (!parent || !kind) {
      standalone.push(entry)
      continue
    }

    const key = `${kind}-${parent.id}`
    const group = grouped.get(key) ?? { parent, kind, children: [] }
    if (entry.kind === kind) group.parentEntry = entry
    else group.children.push(entry)
    grouped.set(key, group)
  }

  return <div className="mt-4 space-y-3">
    {[...grouped.values()].map((group) => <article key={`${group.kind}-${group.parent.id}`} className="rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className={`text-xs font-bold uppercase tracking-wide ${group.kind === 'project' ? 'text-blue-600' : 'text-purple-600'}`}>{group.kind}</p><h3 className="mt-1 font-bold">{group.parent.title}</h3></div><p className="text-xs text-muted-foreground">{group.parent.dueDate && `Due ${group.parent.dueDate}`}</p></div><div className="mt-3 ml-2 border-l-2 border-blue-200 pl-3 dark:border-blue-500/30">{group.children.length ? <ul className="space-y-2">{group.children.sort((a, b) => entryTimestamp(a).localeCompare(entryTimestamp(b))).map((entry) => <li key={`${entry.kind}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50/60 px-3 py-2 text-sm dark:bg-blue-500/10"><span>{entry.title}</span><span className="text-xs text-muted-foreground">{entryDate(entry)} {entry.entry_time?.slice(0, 5)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No linked tasks scheduled in this range.</p>}</div></article>)}
    {standalone.map((entry) => <div key={`${entry.kind}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"><span><span className="mr-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-700 dark:text-slate-200">{entry.kind}</span>{entry.title}</span><span className="text-xs text-muted-foreground">{entryDate(entry)} {entry.entry_time?.slice(0, 5)}</span></div>)}
    {!grouped.size && !standalone.length && <p className="text-sm text-muted-foreground">Nothing scheduled in this range.</p>}
  </div>
}

function Week({ days, entries, onDayClick }: { days: Date[]; entries: Entry[]; onDayClick: (day: Date) => void }) {
  const allDay = entries.filter((entry) => !entry.entry_time && !entry.starts_at)
  const hours = Array.from({ length: 13 }, (_, index) => index + 8)
  return <div className="overflow-x-auto rounded-2xl bg-card shadow-sm"><div className="min-w-220"><div className="grid grid-cols-[70px_repeat(7,minmax(130px,1fr))] border-b"><div/>{days.map((day) => <button key={iso(day)} onClick={() => onDayClick(day)} className="p-3 text-center text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-500/10">{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</button>)}</div><div className="grid grid-cols-[70px_repeat(7,minmax(130px,1fr))] border-b"><div className="p-2 text-xs text-muted-foreground">All-day</div>{days.map((day) => <div key={iso(day)} className="min-h-14 border-l p-1">{allDay.filter((entry) => entryDate(entry) === iso(day)).map((entry) => <div key={`${entry.kind}-${entry.id}`} className={`mb-1 truncate rounded px-2 py-1 text-xs font-semibold ${colors[entry.kind] ?? colors.task}`}>{entry.title}</div>)}</div>)}</div>{hours.map((hour) => <div key={hour} className="grid grid-cols-[70px_repeat(7,minmax(130px,1fr))]"><div className="border-b p-2 text-xs text-muted-foreground">{String(hour).padStart(2, '0')}:00</div>{days.map((day) => <div key={iso(day)} className="min-h-16 border-b border-l p-1">{entries.filter((entry) => entryDate(entry) === iso(day) && entry.entry_time?.startsWith(String(hour).padStart(2, '0'))).map((entry) => <div key={`${entry.kind}-${entry.id}`} className={`rounded px-2 py-1 text-xs font-semibold ${colors[entry.kind] ?? colors.task}`}>{entry.entry_time?.slice(0, 5)} {entry.title}</div>)}</div>)}</div>)}</div></div>
}

export function CalendarView({ entries = [], projects = [], goals = [], taskParents = [], workspaceId }: { entries?: Entry[]; projects?: Parent[]; goals?: Parent[]; taskParents?: TaskParent[]; workspaceId: string }) {
  const router = useRouter()
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addingEvent, setAddingEvent] = useState(false)
  const [eventKind, setEventKind] = useState('')
  const start = useMemo(() => { const date = new Date(cursor); if (view === 'month') { date.setDate(1); date.setDate(1 - date.getDay()) } else if (view === 'week') date.setDate(date.getDate() - date.getDay()); return date }, [cursor, view])
  const days = Array.from({ length: view === 'month' ? 35 : view === 'week' ? 7 : 1 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date })
  const inRange = entries.filter((entry) => { const date = entryDate(entry); return date && date >= iso(days[0]) && date <= iso(days.at(-1)!) })
  const shift = (amount: number) => setCursor((date) => { const next = new Date(date); next.setDate(next.getDate() + (view === 'month' ? amount * 30 : view === 'week' ? amount * 7 : amount)); return next })
  const openDay = (day: Date) => { setSelectedDay(day); setAddingEvent(false) }
  const event = (entry: Entry) => <div key={`${entry.kind}-${entry.id}`} className={`mt-1 truncate rounded px-2 py-1 text-xs font-semibold ${colors[entry.kind] ?? colors.task}`}><CalendarDays className="mr-1 inline size-3"/>{entry.entry_time?.slice(0, 5)} {entry.title}</div>

  return <section className="mx-auto max-w-7xl">
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button 
        onClick={() => setCursor(new Date())} 
        className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold"
      >
          Today
      </button>
      <button 
        onClick={() => shift(-1)} 
        className="rounded-lg p-2 hover:bg-muted"
      >
        <ChevronLeft/>
      </button>
      
      <button 
        onClick={() => shift(1)} 
        className="rounded-lg p-2 hover:bg-muted"
      >
          <ChevronRight/>
      </button>
      
      <h1 className="text-2xl font-bold">
        {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </h1>
      
      <div className="ml-auto flex rounded-xl bg-muted p-1">
        {(['month', 'week', 'day'] as const).map((nextView) => 
        <button 
          key={nextView} 
          onClick={() => setView(nextView)} 
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${view === nextView ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
        >
          {nextView}
        </button>)}
      </div>
    </div>
    
    {view === 'week' ? 
      <Week days={days} entries={inRange} onDayClick={openDay}/> 
      : <div className={`grid overflow-hidden rounded-2xl bg-card shadow-sm ${view === 'month' ? 'grid-cols-7' : 'grid-cols-1'}`}>
          {view === 'month' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => 
            <div key={day} className="border-b p-3 text-center text-xs font-bold text-muted-foreground">
              {day}
            </div>
          )}
          {days.map((day) => 
            <button 
              key={iso(day)} 
              onClick={() => openDay(day)} 
              className={`border-b border-r p-2 text-left transition hover:bg-blue-50 dark:hover:bg-blue-500/10 ${view === 'month' ? 'min-h-28' : 'min-h-96'}`}
            >
              <p className="text-sm font-semibold">
                {day.toLocaleDateString(undefined, { weekday: view === 'month' ? undefined : 'long', day: 'numeric' })}
              </p>
              
              {inRange.filter((entry) => entryDate(entry) === iso(day)).map(event)}
            </button>)}
            
          </div>}
          
          <section className="mt-8 rounded-2xl bg-blue-50/40 p-6 dark:bg-blue-500/5">
            <h2 className="font-bold">Activities in this {view}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks are nested beneath their project or goal and ordered by their scheduled time.
            </p>
            <HierarchyList entries={inRange} projects={projects} goals={goals} taskParents={taskParents}/>
          </section>
          
          {selectedDay && 
            <div 
              role="dialog" 
              aria-modal="true" 
              aria-labelledby="calendar-day-title" 
              className="fixed inset-0 z-[60] grid place-items-center p-4"
            >
              <button type="button" 
                onClick={() => setSelectedDay(null)} 
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" 
                aria-label="Close day options"
              />
              <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
                <h2 id="calendar-day-title" className="text-xl font-bold">
                  {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                
                {!addingEvent ? 
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Would you like to review this day or add something new?
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <button onClick={() => setSelectedDay(null)} className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-muted">
                        Cancel
                      </button>
                      <button onClick={() => { setCursor(selectedDay); setView('day'); setSelectedDay(null) }} className="h-10 rounded-xl border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-300">
                        View day
                      </button>
                      <button onClick={() => setAddingEvent(true)} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500">
                        Add event
                      </button>
                      
                    </div>
                  </> 
                  : <form action={createCalendarEventAction} className="mt-5 space-y-3">
                      <input type="hidden" name="workspaceId" value={workspaceId}/>
                      <input type="hidden" name="date" value={iso(selectedDay)}/>
                      <label className="block text-sm font-semibold">
                        Type
                        <select name="eventKind" value={eventKind} onChange={(event) => setEventKind(event.target.value)} className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3 text-zinc-700">
                          <option className='text-zinc-700' value="">Generic event (Reminder)</option>
                          <option className='text-zinc-700' value="project">Project</option>
                          <option className='text-zinc-700' value="goal">Goal</option>
                          <option className='text-zinc-700' value="task">Task</option>
                        </select>
                      </label>
                      <label className="block text-sm font-semibold">
                        Title
                        <input required name="title" placeholder="What needs to happen?" className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3"/>
                      </label>
                      
                      {eventKind !== 'goal' && 
                        <label className="block text-sm font-semibold">
                          Time <span className="font-normal text-muted-foreground">(optional)</span>
                          <input name="time" type="time" className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3"/>
                        </label>
                      }
                      {eventKind === 'goal' && 
                        <label className="block text-sm font-semibold">
                          Goal duration
                          <select name="term" className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3">
                            <option value="short_term">Short term</option>
                            <option value="long_term">Long term</option>
                          </select>
                        </label>
                      }
                      
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setAddingEvent(false)} className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-muted">
                          Back
                        </button>
                        <EventSubmitButton/>
                      </div>
                    </form>}
                  </div>
                </div>}
              </section>
}