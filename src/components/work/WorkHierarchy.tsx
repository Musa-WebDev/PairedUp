import Link from 'next/link'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  due_time: string | null
  starts_at: string | null
  created_at: string
  project_id: string | null
  goal_id: string | null
}

type Parent = {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
}

function taskTimestamp(task: Task) {
  return task.starts_at ?? `${task.due_date ?? '9999-12-31'}T${task.due_time ?? '23:59:59'}`
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function TaskRow({ task }: { task: Task }) {
  const date = task.due_date ?? task.starts_at?.slice(0, 10)
  const time = task.due_time ?? task.starts_at?.slice(11, 16)
  return (
    <li className="rounded-xl border border-border/70 bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{task.title}</p>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{statusLabel(task.status)}</span>
      </div>
      {date && <p className="mt-1 text-xs text-muted-foreground">{date}{time ? ` at ${time.slice(0, 5)}` : ''}</p>}
    </li>
  )
}

function ParentCard({ parent, kind, tasks }: { parent: Parent; kind: 'project' | 'goal'; tasks: Task[] }) {
  const label = kind === 'project' ? 'Project' : 'Goal'
  const href = kind === 'project' ? '/tasks/projects' : '/tasks/goals'
  return (
    <article className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${kind === 'project' ? 'text-blue-600' : 'text-purple-600'}`}>{label}</p>
          <h3 className="mt-1 font-bold">{parent.title}</h3>
          {parent.description && <p className="mt-1 text-sm text-muted-foreground">{parent.description}</p>}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="capitalize">{statusLabel(parent.status)}</p>
          {parent.dueDate && <p className="mt-1">Due {parent.dueDate}</p>}
        </div>
      </div>
      <div className="mt-4 ml-2 border-l-2 border-blue-200 pl-4 dark:border-blue-500/30">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{kind === 'goal' ? 'Steps' : 'Tasks'}</p>
        {tasks.length ? <ul className="mt-2 space-y-2">{tasks.map((task) => <TaskRow key={task.id} task={task} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No linked {kind === 'goal' ? 'steps' : 'tasks'} yet.</p>}
      </div>
      <Link href={href} className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">Open {label.toLowerCase()}</Link>
    </article>
  )
}

export function WorkHierarchy({ projects, goals, tasks }: { projects: Parent[]; goals: Parent[]; tasks: Task[] }) {
  const openTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status))
  const sorted = (items: Task[]) => [...items].sort((a, b) => taskTimestamp(a).localeCompare(taskTimestamp(b)))
  const standalone = sorted(openTasks.filter((task) => !task.project_id && !task.goal_id))

  return (
    <section className="rounded-2xl bg-blue-50/40 p-6 dark:bg-blue-500/5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-bold text-blue-600">WORK OVERVIEW</p><h2 className="mt-1 text-xl font-bold">Projects, goals & tasks</h2></div>
        <p className="text-sm text-muted-foreground">Linked work stays grouped under its parent.</p>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {projects.map((project) => <ParentCard key={`project-${project.id}`} parent={project} kind="project" tasks={sorted(openTasks.filter((task) => task.project_id === project.id))} />)}
        {goals.map((goal) => <ParentCard key={`goal-${goal.id}`} parent={goal} kind="goal" tasks={sorted(openTasks.filter((task) => task.goal_id === goal.id))} />)}
      </div>
      {standalone.length > 0 && <div className="mt-5"><p className="text-sm font-bold">Independent tasks</p><ul className="mt-2 grid gap-2 md:grid-cols-2">{standalone.map((task) => <TaskRow key={task.id} task={task} />)}</ul></div>}
      {!projects.length && !goals.length && !standalone.length && <p className="mt-5 text-sm text-muted-foreground">No active work yet.</p>}
    </section>
  )
}