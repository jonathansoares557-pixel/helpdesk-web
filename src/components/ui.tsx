import { useState, type ReactNode } from 'react'
import { statusLabel, type Status } from '../lib/api'

const statusStyle: Record<Status, string> = {
  OPEN: 'bg-feedback-open/10 text-feedback-open',
  IN_PROGRESS: 'bg-feedback-progress/10 text-feedback-progress',
  CLOSED: 'bg-feedback-done/10 text-feedback-done',
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[status]}`}>{statusLabel[status]}</span>
}

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const style = { width: size, height: size }
  if (url) return <img src={url} alt={name} style={style} className="rounded-full object-cover" />
  return (
    <span style={style} className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
      {name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</div>
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-brand">{children}</h1>
      {action}
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-2xl leading-none text-gray-400">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ErrorText({ message }: { message: string }) {
  return message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p> : null
}

export function useAction() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(fn: () => Promise<unknown>, onError: (e: unknown) => string) {
    setBusy(true)
    setError('')
    try {
      await fn()
      return true
    } catch (e) {
      setError(onError(e))
      return false
    } finally {
      setBusy(false)
    }
  }
  return { error, busy, run }
}
