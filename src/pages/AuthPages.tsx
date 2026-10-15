import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ErrorText, useAction } from '../components/ui'
import { errorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <p className="text-center text-2xl font-bold text-brand">HelpDesk</p>
        <h1 className="mb-5 mt-1 text-center text-sm text-gray-500">{title}</h1>
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { error, busy, run } = useAction()

  if (user) return <Navigate to="/tickets" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (await run(() => login(email, password), errorMessage)) navigate('/tickets')
  }

  return (
    <Shell title="Acesse o portal">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@email.com" />
        </div>
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" />
        </div>
        <ErrorText message={error} />
        <button className="btn w-full" disabled={busy}>
          Entrar
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        Ainda não tem conta?{' '}
        <Link to="/register" className="font-bold text-brand">
          Cadastre-se
        </Link>
      </p>
    </Shell>
  )
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { error, busy, run } = useAction()

  if (user) return <Navigate to="/tickets" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (await run(() => register(form.name, form.email, form.password), errorMessage)) navigate('/tickets')
  }

  return (
    <Shell title="Crie sua conta de cliente">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="mt-1 text-xs text-gray-400">Mínimo de 6 caracteres</p>
        </div>
        <ErrorText message={error} />
        <button className="btn w-full" disabled={busy}>
          Cadastrar
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link to="/login" className="font-bold text-brand">
          Entrar
        </Link>
      </p>
    </Shell>
  )
}
