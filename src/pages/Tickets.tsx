import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Card, ErrorText, Modal, PageTitle, StatusBadge, useAction } from '../components/ui'
import {
  api,
  errorMessage,
  formatDate,
  formatDay,
  money,
  statusLabel,
  type Service,
  type Status,
  type Ticket,
  type User,
} from '../lib/api'
import { useAuth } from '../lib/auth'

export function TicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[] | null>(null)

  useEffect(() => {
    api.get<Ticket[]>('/tickets').then((r) => setTickets(r.data))
  }, [])

  const title = user?.role === 'ADMIN' ? 'Chamados' : 'Meus chamados'
  const isTech = user?.role === 'TECHNICIAN'

  return (
    <>
      <PageTitle
        action={
          user?.role === 'CLIENT' && (
            <Link to="/tickets/new" className="btn">
              + Novo chamado
            </Link>
          )
        }
      >
        {title}
      </PageTitle>
      {!tickets ? (
        <p className="text-gray-500">Carregando...</p>
      ) : tickets.length === 0 ? (
        <Card className="text-center text-gray-500">Nenhum chamado encontrado.</Card>
      ) : (
        <>
          {/* Technician/client: cards grouped by status (as in the Figma) */}
          <div className={isTech ? 'space-y-6' : 'space-y-6 md:hidden'}>
            {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as Status[]).map((status) => {
              const group = tickets.filter((t) => t.status === status)
              if (!group.length) return null
              return (
                <section key={status}>
                  <div className="mb-3">
                    <StatusBadge status={status} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.map((t) => {
                      const other = user?.role === 'TECHNICIAN' ? t.client : t.technician
                      return (
                        <Link key={t.id} to={`/tickets/${t.id}`} className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand">
                          <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <span className="font-mono font-bold">{t.id.slice(0, 5).toUpperCase()}</span>
                            <span>{formatDate(t.updatedAt)}</span>
                          </div>
                          <p className="font-bold">{t.title}</p>
                          <p className="text-sm text-gray-500">{t.services[0]?.title}</p>
                          <p className="mt-2 text-right text-sm font-bold">{money(t.totalCents)}</p>
                          <p className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2 text-sm">
                            <Avatar name={other.name} url={other.avatarUrl} size={24} />
                            {other.name}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
          {/* Admin: table */}
          <Card className={isTech ? 'hidden' : 'hidden overflow-x-auto md:block'}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-3">Atualizado em</th>
                  <th className="pb-3">Id</th>
                  <th className="pb-3">Título</th>
                  <th className="pb-3">Serviço</th>
                  <th className="pb-3">Valor total</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Técnico</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3">{formatDate(t.updatedAt)}</td>
                    <td className="py-3 font-mono text-xs font-bold">{t.id.slice(0, 5).toUpperCase()}</td>
                    <td className="py-3 font-semibold">
                      <Link to={`/tickets/${t.id}`} className="text-brand hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3">{t.services[0]?.title}</td>
                    <td className="py-3">{money(t.totalCents)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={t.client.name} url={t.client.avatarUrl} size={24} />
                        {t.client.name}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={t.technician.name} url={t.technician.avatarUrl} size={24} />
                        {t.technician.name}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  )
}

export function TicketDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [adding, setAdding] = useState(false)
  const { error, busy, run } = useAction()

  const load = useCallback(() => api.get<Ticket>(`/tickets/${id}`).then((r) => setTicket(r.data)), [id])

  useEffect(() => {
    load()
    if (user?.role === 'TECHNICIAN') api.get<Service[]>('/services').then((r) => setServices(r.data))
  }, [load, user?.role])

  if (!ticket) return <p className="text-gray-500">Carregando...</p>

  const canChangeStatus = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN'
  const closed = ticket.status === 'CLOSED'

  const setStatus = (status: Status) =>
    run(async () => setTicket((await api.patch<Ticket>(`/tickets/${ticket.id}/status`, { status })).data), errorMessage)

  const addService = async (e: FormEvent) => {
    e.preventDefault()
    if (!serviceId) return
    await run(async () => {
      setTicket((await api.post<Ticket>(`/tickets/${ticket.id}/services`, { serviceId })).data)
      setServiceId('')
      setAdding(false)
    }, errorMessage)
  }

  return (
    <>
      <PageTitle action={<Link to="/tickets" className="btn-ghost">Voltar</Link>}>Chamado</PageTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold">{ticket.title}</h2>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{ticket.description}</p>
          <p className="mt-4 text-xs text-gray-400">
            Criado em {formatDate(ticket.createdAt)} · Atendimento agendado para {formatDay(ticket.scheduledDate)} às{' '}
            {ticket.scheduledTime}
          </p>

          <h3 className="label mt-6">Serviços</h3>
          <ul className="divide-y divide-gray-100 text-sm">
            {ticket.services.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>
                  {s.title} {s.additional && <em className="text-xs text-gray-400">(adicional)</em>}
                </span>
                <span>{money(s.priceCents)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2 font-bold">
              <span>Total</span>
              <span>{money(ticket.totalCents)}</span>
            </li>
          </ul>

          {user?.role === 'TECHNICIAN' && !closed && (
            <button className="btn-ghost mt-4" onClick={() => setAdding(true)}>
              + Serviço adicional
            </button>
          )}
          {adding && (
            <Modal title="Serviço adicional" onClose={() => setAdding(false)}>
              <form onSubmit={addService} className="space-y-4">
                <div>
                  <label className="label">Descrição</label>
                  <select className="input" required value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                    <option value="">Selecione o serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Valor</label>
                  <input className="input" disabled value={money(services.find((s) => s.id === serviceId)?.priceCents ?? 0)} />
                </div>
                <ErrorText message={error} />
                <button className="btn w-full" disabled={busy || !serviceId}>
                  Salvar
                </button>
              </form>
            </Modal>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="label">Cliente</h3>
            <p className="flex items-center gap-2 text-sm">
              <Avatar name={ticket.client.name} url={ticket.client.avatarUrl} />
              {ticket.client.name}
            </p>
            <h3 className="label mt-4">Técnico</h3>
            <p className="flex items-center gap-2 text-sm">
              <Avatar name={ticket.technician.name} url={ticket.technician.avatarUrl} />
              {ticket.technician.name}
            </p>
          </Card>

          {canChangeStatus && (
            <Card className="space-y-2">
              <h3 className="label">Alterar status</h3>
              {user?.role === 'ADMIN' ? (
                (['OPEN', 'IN_PROGRESS', 'CLOSED'] as Status[]).map((s) => (
                  <button key={s} className="btn-ghost w-full" disabled={busy || s === ticket.status} onClick={() => setStatus(s)}>
                    {statusLabel[s]}
                  </button>
                ))
              ) : (
                <>
                  {ticket.status === 'OPEN' && (
                    <button className="btn w-full" disabled={busy} onClick={() => setStatus('IN_PROGRESS')}>
                      Iniciar atendimento
                    </button>
                  )}
                  {ticket.status !== 'CLOSED' && (
                    <button className="btn-danger w-full" disabled={busy} onClick={() => setStatus('CLOSED')}>
                      Encerrar atendimento
                    </button>
                  )}
                  {closed && <p className="text-sm text-gray-500">Chamado encerrado.</p>}
                </>
              )}
            </Card>
          )}
          <ErrorText message={error} />
        </div>
      </div>
    </>
  )
}

export function NewTicketPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    title: '',
    description: '',
    serviceId: '',
    technicianId: '',
    scheduledDate: today,
    scheduledTime: '',
  })
  const { error, busy, run } = useAction()

  useEffect(() => {
    api.get<Service[]>('/services').then((r) => setServices(r.data))
    api.get<User[]>('/technicians').then((r) => setTechnicians(r.data))
  }, [])

  useEffect(() => {
    if (!form.technicianId || !form.scheduledDate) return
    api
      .get<{ slots: string[] }>(`/technicians/${form.technicianId}/slots`, { params: { date: form.scheduledDate } })
      .then((r) => setSlots(r.data.slots))
  }, [form.technicianId, form.scheduledDate])

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v, ...(k !== 'scheduledTime' ? { scheduledTime: '' } : {}) }))
  const selected = services.find((s) => s.id === form.serviceId)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.scheduledTime) return
    if (await run(() => api.post('/tickets', form), errorMessage)) navigate('/tickets')
  }

  return (
    <>
      <PageTitle>Novo chamado</PageTitle>
      <div className="grid items-start gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-4 font-bold">Informações</h2>
        <form id="new-ticket" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="input" required minLength={3} value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-24" required minLength={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Categoria de serviço</label>
            <select className="input" required value={form.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            {selected && <p className="mt-1 text-sm text-gray-500">Valor: {money(selected.priceCents)}</p>}
          </div>
          <div>
            <label className="label">Técnico</label>
            <select className="input" required value={form.technicianId} onChange={(e) => set('technicianId', e.target.value)}>
              <option value="">Selecione...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Data</label>
            <input className="input" type="date" min={today} required value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
          </div>
          {form.technicianId && (
            <div>
              <label className="label">Horários disponíveis</label>
              {slots.length === 0 ? (
                <p className="text-sm text-gray-500">Sem horários livres nesta data.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => set('scheduledTime', s)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${form.scheduledTime === s ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <ErrorText message={error} />
        </form>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-bold">Resumo</h2>
        <p className="text-xs text-gray-500">Valor do serviço</p>
        <p className="text-2xl font-bold">{money(selected?.priceCents ?? 0)}</p>
        <p className="text-xs text-gray-500">O chamado é criado com status aberto. Serviços adicionais podem ser incluídos pelo técnico.</p>
        <button form="new-ticket" className="btn w-full" disabled={busy || !form.scheduledTime}>
          Criar chamado
        </button>
      </Card>
      </div>
    </>
  )
}
