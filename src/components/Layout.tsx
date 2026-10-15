import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { roleLabel, type Role } from '../lib/api'
import { useAuth } from '../lib/auth'
import { PasswordModal, ProfileModal } from '../pages/Profile'
import { Avatar } from './ui'

const links: { to: string; label: string; roles: Role[] }[] = [
  { to: '/tickets', label: 'Chamados', roles: ['ADMIN', 'TECHNICIAN', 'CLIENT'] },
  { to: '/tickets/new', label: 'Criar chamado', roles: ['CLIENT'] },
  { to: '/technicians', label: 'Técnicos', roles: ['ADMIN'] },
  { to: '/clients', label: 'Clientes', roles: ['ADMIN'] },
  { to: '/services', label: 'Serviços', roles: ['ADMIN'] },
]

export function Layout() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState<'profile' | 'password' | null>(null)

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-sidebar lg:flex">
      <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-white lg:hidden">
        <span className="text-lg font-bold">HelpDesk</span>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="text-2xl">
          {open ? '×' : '☰'}
        </button>
      </header>

      <aside
        className={`${open ? 'block' : 'hidden'} bg-sidebar text-gray-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col`}
      >
        <div className="hidden px-5 py-6 lg:block">
          <p className="text-xl font-bold text-white">HelpDesk</p>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-400">{roleLabel[user.role]}</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-3">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/tickets'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'hover:bg-white/10'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="relative mt-auto border-t border-white/10 p-3">
          {menu && (
            <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg bg-sidebar p-1 shadow-xl ring-1 ring-white/10">
              <p className="px-3 py-1 text-xs uppercase text-gray-500">Opções</p>
              <button
                onClick={() => {
                  setMenu(false)
                  setOpen(false)
                  setModal('profile')
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-white/10"
              >
                Perfil
              </button>
              <button onClick={logout} className="block w-full rounded px-3 py-2 text-left text-sm text-feedback-danger hover:bg-white/10">
                Sair
              </button>
            </div>
          )}
          <button onClick={() => setMenu(!menu)} className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-white/5">
            <Avatar name={user.name} url={user.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="block truncate text-xs">{user.email}</span>
            </span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 flex-1 bg-gray-100 p-4 sm:p-6 lg:mt-3 lg:min-h-[calc(100vh-0.75rem)] lg:rounded-tl-3xl lg:p-10">
        {user.mustChangePassword && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Você está usando uma senha provisória.{' '}
            <button onClick={() => setModal('password')} className="font-bold underline">
              Alterar senha
            </button>
          </div>
        )}
        <Outlet />
      </main>
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} onPassword={() => setModal('password')} />}
      {modal === 'password' && <PasswordModal onClose={() => setModal(null)} />}
    </div>
  )
}
