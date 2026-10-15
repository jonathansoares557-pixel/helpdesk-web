import axios from 'axios'

export type Role = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
export type Status = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl: string | null
  availability: string[]
  mustChangePassword: boolean
}

export interface Service {
  id: string
  title: string
  description: string | null
  priceCents: number
  active: boolean
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: Status
  scheduledDate: string
  scheduledTime: string
  createdAt: string
  updatedAt: string
  client: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
  technician: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
  services: { id: string; serviceId: string; title: string; priceCents: number; additional: boolean }[]
  totalCents: number
}

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333' })

const TOKEN_KEY = 'helpdesk:token'
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      tokenStore.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const issues = e.response?.data?.issues as { path: string; message: string }[] | undefined
    if (issues?.length) return issues.map((i) => `${i.path}: ${i.message}`).join('; ')
    return e.response?.data?.message ?? e.message
  }
  return 'Erro inesperado'
}

export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const statusLabel: Record<Status, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  CLOSED: 'Encerrado',
}

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  TECHNICIAN: 'Técnico',
  CLIENT: 'Cliente',
}

export const formatDate = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
export const formatDay = (d: string) => d.split('-').reverse().join('/')
