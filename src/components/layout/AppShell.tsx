'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, FileText, FolderKanban, LayoutDashboard, LogOut, Moon, NotebookPen, Sun, Target, UserRound } from 'lucide-react'
import { signOutAction } from '@/actions/auth'

const taskLinks = [
  { href: '/tasks/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks/goals', label: 'Goals', icon: Target },
  { href: '/tasks/notes', label: 'Notes', icon: NotebookPen },
  { href: '/tasks/reminders', label: 'Reminders', icon: FileText },
]

export function AppShell({ children, displayName, email }: { children: ReactNode; displayName: string; email: string }) {
  const pathname = usePathname()
  const [tasksOpen, setTasksOpen] = useState(pathname.startsWith('/tasks'))
  const [dark, setDark] = useState(false)
  useEffect(() => { const value = localStorage.getItem('pairup-theme') === 'dark'; setDark(value); document.documentElement.classList.toggle('dark', value) }, [])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('pairup-theme', next ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', next) }
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))
  return <div className="min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 hidden w-68 flex-col bg-[#2563eb] px-4 py-5 text-white shadow-xl lg:flex">
      <Link href="/" className="mb-10 flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black text-blue-600">P</span><span className="text-xl font-bold tracking-tight">PairUp</span></Link>
      <nav className="space-y-1"><NavLink href="/" label="Dashboard" icon={LayoutDashboard} active={active('/')} /><button onClick={() => setTasksOpen(!tasksOpen)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-50 hover:bg-white/15"><FolderKanban className="size-5" />Tasks <ChevronDown className={`ml-auto size-4 transition-transform ${tasksOpen ? 'rotate-180' : ''}`} /></button>{tasksOpen && <div className="ml-3 space-y-1 border-l border-white/30 pl-3">{taskLinks.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={active(href)} compact />)}<button className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-100 hover:bg-white/15">+ Custom item</button></div>}<NavLink href="/calendar" label="Calendar" icon={CalendarDays} active={active('/calendar')} /><NavLink href="/profile" label="Profile" icon={UserRound} active={active('/profile')} /></nav>
      <div className="mt-auto space-y-3 border-t border-white/25 pt-4"><button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-50 hover:bg-white/15">{dark ? <Sun className="size-5" /> : <Moon className="size-5" />}{dark ? 'Light mode' : 'Dark mode'}</button><form action={signOutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-50 hover:bg-white/15"><LogOut className="size-5" />Logout</button></form></div>
    </aside>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-black px-5 text-white shadow-sm lg:ml-68"><Link href="/" className="text-lg font-bold lg:hidden">PairUp</Link><div className="ml-auto flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-purple-500 text-sm font-bold">{displayName.slice(0,1).toUpperCase()}</span><div className="hidden text-right sm:block"><p className="text-sm font-semibold leading-4">{displayName}</p><p className="mt-1 text-xs text-slate-400">{email}</p></div></div></header>
    <main className="min-h-[calc(100vh-4rem)] p-5 lg:ml-68 lg:p-8">{children}</main>
  </div>
}
function NavLink({ href, label, icon: Icon, active, compact = false }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean; compact?: boolean }) { return <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${compact ? 'py-2 text-blue-100' : ''} ${active ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-50 hover:bg-white/15'}`}><Icon className="size-5" />{label}</Link> }