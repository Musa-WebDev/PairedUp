'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, ChevronsLeft, ChevronsRight, FolderKanban, LayoutDashboard, LogOut, Menu, Moon, NotebookPen, Sun, Target, UserRound, X } from 'lucide-react'
import { signOutAction } from '@/actions/auth'

const tasks = [
  ['/tasks/projects', 'Projects', FolderKanban],
  ['/tasks/goals', 'Goals', Target],
  ['/tasks/notes', 'Notes', NotebookPen],
  ['/tasks/reminders', 'Reminders', CalendarDays],
] as const

export function AppShell({ children, displayName, email }: { children: ReactNode; displayName: string; email: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(pathname.startsWith('/tasks'))
  const [dark, setDark] = useState(false)
  useEffect(() => { const enabled = localStorage.getItem('pairup-theme') === 'dark'; setDark(enabled); document.documentElement.classList.toggle('dark', enabled) }, [])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('pairup-theme', next ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', next) }
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const offset = collapsed ? 'lg:ml-24' : 'lg:ml-72'
  const nav = (href: string, label: string, Icon: typeof LayoutDashboard, small = false) => <Link onClick={() => setMobileOpen(false)} href={href} title={collapsed ? label : undefined} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${collapsed ? 'lg:justify-center' : ''} ${small ? 'py-2 text-blue-100' : ''} ${isActive(href) ? 'bg-white/95 text-blue-700 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)]' : 'text-blue-50 hover:bg-white/15 hover:text-white'}`}><Icon className="size-5 shrink-0" />{!collapsed && label}</Link>

  return <div className="min-h-screen bg-transparent text-foreground">
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
      <div className="ml-auto flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white shadow-sm">{displayName.slice(0, 1).toUpperCase()}</span>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
    </header>

    <main className={`min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 ${offset}`}>{children}</main>
  </div>
}