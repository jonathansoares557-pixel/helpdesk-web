import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, ErrorText, Modal, useAction } from '../components/ui'
import { api, errorMessage, roleLabel, type User } from '../lib/api'
import { useAuth } from '../lib/auth'
import { SlotPicker } from './Admin'

export function ProfileModal({ onClose, onPassword }: { onClose: () => void; onPassword: () => void }) {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user!.name, email: user!.email, availability: user!.availability })
  const profile = useAction()
  const avatar = useAction()

  async function save(e: FormEvent) {
    e.preventDefault()
    const ok = await profile.run(async () => {
      const { availability, ...rest } = form
      setUser((await api.put<User>('/me', user!.role === 'TECHNICIAN' ? { ...rest, availability } : rest)).data)
    }, errorMessage)
    if (ok) onClose()
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = new FormData()
    data.append('avatar', file)
    await avatar.run(async () => setUser((await api.post<User>('/me/avatar', data)).data), errorMessage)
  }

  async function deleteAccount() {
    if (!confirm('Excluir sua conta? Todos os seus chamados também serão excluídos.')) return
    await api.delete('/me')
    logout()
    navigate('/login')
  }

  return (
    <Modal title="Perfil" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={user!.name} url={user!.avatarUrl} size={48} />
          <label className="btn-ghost cursor-pointer">
            Nova imagem
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={upload} />
          </label>
          <span className="text-xs font-bold uppercase text-brand-light">{roleLabel[user!.role]}</span>
        </div>
        <ErrorText message={avatar.error} />
        <div>
          <label className="label">Nome</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Senha</label>
          <div className="flex gap-2">
            <input className="input" type="password" value="••••••••" disabled readOnly />
            <button type="button" className="btn-ghost" onClick={onPassword}>
              Alterar
            </button>
          </div>
        </div>
        {user!.role === 'TECHNICIAN' && (
          <div>
            <label className="label">Disponibilidade</label>
            <SlotPicker value={form.availability} onChange={(v) => setForm({ ...form, availability: v })} />
          </div>
        )}
        <ErrorText message={profile.error} />
        <button className="btn w-full" disabled={profile.busy}>
          Salvar
        </button>
        {user!.role === 'CLIENT' && (
          <button type="button" className="w-full text-sm font-bold text-feedback-danger hover:underline" onClick={deleteAccount}>
            Excluir minha conta
          </button>
        )}
      </form>
    </Modal>
  )
}

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const { setUser } = useAuth()
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const { error, busy, run } = useAction()

  async function save(e: FormEvent) {
    e.preventDefault()
    if (await run(async () => setUser((await api.put<User>('/me/password', pw)).data), errorMessage)) onClose()
  }

  return (
    <Modal title="Alterar senha" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Senha atual</label>
          <input className="input" type="password" required placeholder="Digite sua senha atual" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <input className="input" type="password" required minLength={6} placeholder="Digite sua nova senha" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <p className="mt-1 text-xs text-gray-500">Mínimo de 6 dígitos</p>
        </div>
        <ErrorText message={error} />
        <button className="btn w-full" disabled={busy}>
          Salvar
        </button>
      </form>
    </Modal>
  )
}
