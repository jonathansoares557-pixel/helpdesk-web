import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Avatar, Card, ErrorText, Modal, PageTitle, useAction } from '../components/ui'
import { api, errorMessage, money, type Service, type User } from '../lib/api'

const DEFAULT_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
export const ALL_SLOTS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

export function SlotPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s].sort())
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
      {ALL_SLOTS.slice(6, 23).map((s) => (
        <button
          type="button"
          key={s}
          onClick={() => toggle(s)}
          className={`rounded-md border px-1 py-1 text-xs font-semibold ${value.includes(s) ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-gray-600'}`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function useList<T>(path: string) {
  const [items, setItems] = useState<T[] | null>(null)
  const load = useCallback(() => api.get<T[]>(path).then((r) => setItems(r.data)), [path])
  useEffect(() => {
    load()
  }, [load])
  return { items, load }
}

export function TechniciansPage() {
  const { items, load } = useList<User>('/technicians')
  const [editing, setEditing] = useState<Partial<User> & { password?: string } | null>(null)
  const { error, busy, run } = useAction()

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = editing!
    const ok = await run(
      () =>
        t.id
          ? api.put(`/technicians/${t.id}`, { name: t.name, email: t.email, availability: t.availability })
          : api.post('/technicians', { name: t.name, email: t.email, password: t.password, availability: t.availability }),
      errorMessage,
    )
    if (ok) {
      setEditing(null)
      load()
    }
  }

  return (
    <>
      <PageTitle
        action={
          <button className="btn" onClick={() => setEditing({ name: '', email: '', password: '', availability: DEFAULT_SLOTS })}>
            + Novo técnico
          </button>
        }
      >
        Técnicos
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items?.map((t) => (
          <Card key={t.id}>
            <div className="flex items-center gap-3">
              <Avatar name={t.name} url={t.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.name}</p>
                <p className="truncate text-sm text-gray-500">{t.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {t.availability.map((s) => (
                <span key={s} className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-semibold text-brand">
                  {s}
                </span>
              ))}
            </div>
            <button className="btn-ghost mt-4 w-full" onClick={() => setEditing(t)}>
              Editar
            </button>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? 'Editar técnico' : 'Novo técnico'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            {!editing.id && (
              <div>
                <label className="label">Senha provisória</label>
                <input className="input" required minLength={6} value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
                <p className="mt-1 text-xs text-gray-400">Repasse ao técnico; ele poderá alterá-la após o primeiro acesso.</p>
              </div>
            )}
            <div>
              <label className="label">Horários de atendimento</label>
              <SlotPicker value={editing.availability ?? []} onChange={(v) => setEditing({ ...editing, availability: v })} />
            </div>
            <ErrorText message={error} />
            <button className="btn w-full" disabled={busy || !editing.availability?.length}>
              Salvar
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}

export function ClientsPage() {
  const { items, load } = useList<User>('/clients')
  const [editing, setEditing] = useState<User | null>(null)
  const { error, busy, run } = useAction()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (await run(() => api.put(`/clients/${editing!.id}`, { name: editing!.name, email: editing!.email }), errorMessage)) {
      setEditing(null)
      load()
    }
  }

  async function remove(c: User) {
    if (!confirm(`Excluir ${c.name}? Todos os chamados deste cliente também serão excluídos.`)) return
    await run(() => api.delete(`/clients/${c.id}`), errorMessage)
    load()
  }

  return (
    <>
      <PageTitle>Clientes</PageTitle>
      <ErrorText message={error} />
      <Card className="mt-2 divide-y divide-gray-100 !p-0">
        {items?.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum cliente cadastrado.</p>}
        {items?.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
            <Avatar name={c.name} url={c.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="truncate text-sm text-gray-500">{c.email}</p>
            </div>
            <button className="btn-ghost" onClick={() => setEditing(c)}>
              Editar
            </button>
            <button className="btn-danger" onClick={() => remove(c)}>
              Excluir
            </button>
          </div>
        ))}
      </Card>
      {editing && (
        <Modal title="Editar cliente" onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <ErrorText message={error} />
            <button className="btn w-full" disabled={busy}>
              Salvar
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}

interface ServiceForm {
  id?: string
  title: string
  description: string
  price: string
}

export function ServicesPage() {
  const { items, load } = useList<Service>('/services')
  const [editing, setEditing] = useState<ServiceForm | null>(null)
  const { error, busy, run } = useAction()

  async function submit(e: FormEvent) {
    e.preventDefault()
    const f = editing!
    const body = { title: f.title, description: f.description || undefined, priceCents: Math.round(parseFloat(f.price.replace(',', '.')) * 100) }
    if (await run(() => (f.id ? api.put(`/services/${f.id}`, body) : api.post('/services', body)), errorMessage)) {
      setEditing(null)
      load()
    }
  }

  async function toggle(s: Service) {
    await run(() => (s.active ? api.patch(`/services/${s.id}/deactivate`) : api.put(`/services/${s.id}`, { active: true })), errorMessage)
    load()
  }

  return (
    <>
      <PageTitle action={<button className="btn" onClick={() => setEditing({ title: '', description: '', price: '' })}>+ Novo serviço</button>}>
        Serviços
      </PageTitle>
      <ErrorText message={error} />
      <Card className="mt-2 divide-y divide-gray-100 !p-0">
        {items?.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${s.active ? '' : 'text-gray-400 line-through'}`}>{s.title}</p>
              <p className="text-sm text-gray-500">{money(s.priceCents)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              {s.active ? 'Ativo' : 'Inativo'}
            </span>
            <button className="btn-ghost" onClick={() => setEditing({ id: s.id, title: s.title, description: s.description ?? '', price: (s.priceCents / 100).toFixed(2) })}>
              Editar
            </button>
            <button className={s.active ? 'btn-danger' : 'btn'} onClick={() => toggle(s)}>
              {s.active ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        ))}
      </Card>
      {editing && (
        <Modal title={editing.id ? 'Editar serviço' : 'Novo serviço'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Título</label>
              <input className="input" required minLength={2} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            </div>
            <ErrorText message={error} />
            <button className="btn w-full" disabled={busy}>
              Salvar
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
