'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { BriefcaseBusiness, CalendarDays, ChevronDown, ChevronsLeft, ChevronsRight, FolderKanban, LayoutDashboard, LogOut, Menu, Moon, NotebookPen, Plus, Sun, Target, UserRound, X } from 'lucide-react'
import { signOutAction } from '@/actions/auth'
import { PushNotificationControl } from '@/components/notifications/PushNotificationControl'
import { createWorkspaceAction, removeWorkspaceMemberAction, setActiveWorkspaceAction } from '@/actions/workspace'
import type { WorkspaceMemberOption, WorkspaceOption } from '@/lib/workspace-context'

const tasks = [
  ['/tasks/projects', 'Projects', FolderKanban],
  ['/tasks/goals', 'Goals', Target],
  ['/tasks/notes', 'Notes', NotebookPen],
  ['/tasks/reminders', 'Reminders', CalendarDays],
] as const

export function AppShell({
  activeWorkspaceId,
  currentUserId,
  avatarUrl,
  workspaceMembers,
  children,
  displayName,
  email,
  workspaces,
}: {
  activeWorkspaceId: string | null
  currentUserId: string
  avatarUrl: string | null
  workspaceMembers: WorkspaceMemberOption[]
  children: ReactNode
  displayName: string
  email: string
  workspaces: WorkspaceOption[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberOption | null>(null)
  const [removePending, setRemovePending] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [tasksOpen, setTasksOpen] = useState(pathname.startsWith('/tasks'))
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('pairup-theme') === 'dark')
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('pairup-theme', next ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', next) }
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const currentMember = workspaceMembers.find((member) => member.id === currentUserId)
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin'
  const canRemoveMember = (member: WorkspaceMemberOption) => canManageMembers && member.id !== currentUserId && member.role !== 'owner'
  async function confirmMemberRemoval() {
    if (!memberToRemove || !activeWorkspaceId) return
    setRemovePending(true)
    setRemoveError('')
    const result = await removeWorkspaceMemberAction(activeWorkspaceId, memberToRemove.id)
    setRemovePending(false)
    if (result.error) {
      setRemoveError(result.error)
      return
    }
    setMemberToRemove(null)
    setMembersOpen(false)
    router.refresh()
  }
  const offset = collapsed ? 'lg:ml-24' : 'lg:ml-72'
  const nav = (href: string, label: string, Icon: typeof LayoutDashboard, small = false) => <Link key={href} onClick={() => setMobileOpen(false)} href={href} title={collapsed ? label : undefined} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${collapsed ? 'lg:justify-center' : ''} ${small ? 'py-2 text-blue-100' : ''} ${isActive(href) ? 'bg-white/95 text-blue-700 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)]' : 'text-blue-50 hover:bg-white/15 hover:text-white'}`}><Icon className="size-5 shrink-0" />{!collapsed && label}</Link>


  return <>
    {memberToRemove && (
      <div role="dialog" aria-modal="true" aria-labelledby="remove-member-title" className="fixed inset-0 z-[60] grid place-items-center p-4">
        <button type="button" aria-label="Close removal confirmation" onClick={() => !removePending && setMemberToRemove(null)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <h2 id="remove-member-title" className="text-lg font-bold">Remove {memberToRemove.displayName}?</h2>
          <p className="mt-2 text-sm text-muted-foreground">They will immediately lose access to this workspace and its shared content. You can invite them again later if needed.</p>
          {removeError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{removeError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={removePending} onClick={() => setMemberToRemove(null)} className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60">Cancel</button>
            <button type="button" disabled={removePending} onClick={confirmMemberRemoval} className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60">{removePending ? 'Removing…' : 'Remove'}</button>
          </div>
        </div>
      </div>
    )}
    <div className="min-h-screen bg-transparent text-foreground">
    {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" />}

    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/15 bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-700 px-4 py-5 text-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.7)] transition-all duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'lg:w-24' : 'lg:w-72'} w-72`}>
      <div className={`mb-8 flex items-center gap-3 ${collapsed ? 'lg:justify-center' : 'px-2'}`}>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" width={40} height={40} alt="PairUp" className="size-10 shrink-0 rounded-2xl object-contain" />
          {!collapsed && <span className="text-xl font-bold tracking-tight">PairUp</span>}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden"><X className="size-5" /></button>
      </div>

      <nav className="space-y-1.5">
        {nav('/', 'Dashboard', LayoutDashboard)}
        <button onClick={() => setTasksOpen(!tasksOpen)} title="Tasks" className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-50 transition-all hover:bg-white/15 ${collapsed ? 'lg:justify-center' : ''}`}>
          <FolderKanban className="size-5 shrink-0" />
          {!collapsed && <><span>Tasks</span><ChevronDown className={`ml-auto size-4 ${tasksOpen ? 'rotate-180' : ''}`} /></>}
        </button>
        {tasksOpen && !collapsed && <div className="ml-3 space-y-1 border-l border-white/30 pl-3">{tasks.map(([href, label, Icon]) => nav(href, label, Icon, true))}</div>}
        {nav('/calendar', 'Calendar', CalendarDays)}
        {nav('/profile', 'Profile', UserRound)}
      </nav>

      {!collapsed && <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-blue-100">
          <BriefcaseBusiness className="size-4" />
          Workspace
        </div>
        {workspaces.length > 0 && <form action={setActiveWorkspaceAction}>
          <select
            aria-label="Active workspace"
            className="h-10 w-full rounded-xl border border-white/25 bg-white/95 px-2 text-sm font-semibold text-blue-950"
            defaultValue={activeWorkspaceId ?? ''}
            name="workspaceId"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
          </select>
        </form>}
        <form action={createWorkspaceAction} className="mt-2 flex gap-2">
          <input required name="name" maxLength={80} placeholder="New workspace" className="h-9 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/95 px-2 text-sm text-blue-950 placeholder:text-slate-500" />
          <button title="Create workspace" className="grid size-9 place-items-center rounded-xl bg-white text-blue-700">
            <Plus className="size-4" />
          </button>
        </form>
      </div>}

      <div className="mt-auto space-y-2 border-t border-white/20 pt-4">
        <button onClick={toggleTheme} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-50 transition-all hover:bg-white/15 ${collapsed ? 'lg:justify-center' : ''}`}>
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          {!collapsed && (dark ? 'Light mode' : 'Dark mode')}
        </button>
        <form action={signOutAction}>
          <button className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-50 transition-all hover:bg-white/15 ${collapsed ? 'lg:justify-center' : ''}`}>
            <LogOut className="size-5" />
            {!collapsed && 'Logout'}
          </button>
        </form>
        <button onClick={() => setCollapsed(!collapsed)} className="hidden w-full justify-center rounded-2xl p-2 transition-all hover:bg-white/15 lg:flex">
          {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
        </button>
      </div>
    </aside>

    <header className={`sticky top-0 z-30 flex h-16 items-center border-b border-border/60 bg-card/90 px-4 text-foreground shadow-[0_10px_35px_-20px_rgba(15,23,42,0.24)] backdrop-blur ${offset}`}>
      <Image src="/logo-big.png" width={160} height={40} alt="PairUp" className="hidden h-9 w-auto object-contain lg:block" priority />
      <button onClick={() => setMobileOpen(true)} className="rounded-2xl p-2 transition hover:bg-muted lg:hidden"><Menu className="size-6" /></button>
      <PushNotificationControl/>
      {workspaceMembers.length > 0 && (
        <div className="relative ml-auto">
          <button type="button" onClick={() => setMembersOpen((open) => !open)} aria-expanded={membersOpen} aria-haspopup="menu" aria-label="View workspace members" className="flex items-center rounded-2xl p-1.5 transition hover:bg-muted">
            <div className="flex -space-x-2">
              {workspaceMembers.slice(0, 3).map((member) => member.avatarUrl ? (
                <img key={member.id} src={member.avatarUrl} alt={member.displayName} className="size-9 rounded-full border-2 border-card object-cover" />
              ) : (
                <span key={member.id} title={member.displayName} className="grid size-9 place-items-center rounded-full border-2 border-card bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white">{member.displayName.slice(0, 1).toUpperCase()}</span>
              ))}
            </div>
            {workspaceMembers.length > 3 && <span className="ml-2 text-xs font-bold text-muted-foreground">+{workspaceMembers.length - 3}</span>}
          </button>
          {membersOpen && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
              <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{workspaceMembers.length} workspace {workspaceMembers.length === 1 ? 'member' : 'members'}</p>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {workspaceMembers.map((member) => (
                  <div key={member.id} role="menuitem" className="flex items-center gap-3 rounded-xl px-2 py-2">
                    {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white">{member.displayName.slice(0, 1).toUpperCase()}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.displayName}</p>
                      <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                    </div>
                    {canRemoveMember(member) && <button type="button" onClick={() => { setMemberToRemove(member); setMembersOpen(false); setRemoveError('') }} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">Remove</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <Link href="/profile" aria-label="Open profile settings" className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-muted">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-10 rounded-full object-cover shadow-sm" />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white shadow-sm">{displayName.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </Link>
    </header>

    <main className={`min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 ${offset}`}>{children}</main>
    </div>
  </>
}