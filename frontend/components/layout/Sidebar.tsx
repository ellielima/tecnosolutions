'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  ClipboardList, LogOut, Menu, X, ChevronRight, Shield, TrendingUp
} from 'lucide-react'
import clsx from 'clsx'
 
const adminNav = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clientes',    icon: Users,            label: 'Clientes' },
  { href: '/proyectos',   icon: FolderKanban,     label: 'Proyectos' },
  { href: '/tareas',      icon: CheckSquare,      label: 'Tareas' },
  { href: '/rendimiento', icon: TrendingUp,       label: 'Rendimiento' },
  { href: '/usuarios',    icon: Shield,           label: 'Usuarios' },
  { href: '/auditoria',   icon: ClipboardList,    label: 'Auditoría' },
]
 
const empNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/tareas',    icon: CheckSquare,     label: 'Mis Tareas' },
]
 
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const nav = isAdmin ? adminNav : empNav
 
  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm font-display">TS</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white">TecnoSolutions</p>
            <p className="text-surface-500 text-xs">Gestión Empresarial</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-surface-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
 
      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400 hover:bg-surface-700/50 hover:text-surface-200'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          )
        })}
      </nav>
 
      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-surface-700">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700/40 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 font-bold text-xs">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-100 truncate">{user?.nombre}</p>
            <p className="text-xs text-surface-500 truncate">{user?.rol}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
 
  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface-800 border-b border-surface-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">TS</span>
          </div>
          <span className="font-display font-bold text-sm text-white">TecnoSolutions</span>
        </div>
        <button onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl bg-surface-700 border border-surface-600 flex items-center justify-center">
          <Menu className="w-4 h-4 text-surface-300" />
        </button>
      </div>
 
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}
 
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface-800 border-r border-surface-700 h-screen sticky top-0 flex-shrink-0">
        <NavContent />
      </aside>
 
      {/* Mobile drawer */}
      <aside className={clsx(
        'fixed left-0 top-0 h-full w-72 bg-surface-800 border-r border-surface-700 z-50 transition-transform duration-300 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>
    </>
  )
}