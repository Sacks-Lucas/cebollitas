import { useEffect, useState } from 'react'

import { es } from '../i18n/es'
import { api } from '../services/api'
import type { Event, MonthlyEventCard, User } from '../types'
import { useAuth } from '../contexts/AuthContext'

function monthName(month: number) {
  return new Date(2026, month - 1, 1).toLocaleString('es-AR', { month: 'long' })
}

export function MonthlyEventPage() {
  const { user } = useAuth()
  const [cards, setCards] = useState<MonthlyEventCard[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [votingEvent, setVotingEvent] = useState<Event | null>(null)
  const [scores, setScores] = useState({ fun: 5, cost: 5, originality: 5 })

  const load = () => {
    void api.get<MonthlyEventCard[]>('/api/monthly-events').then((response) => setCards(response.data))
  }

  useEffect(() => {
    load()
    void api.get<User[]>('/api/users').then((response) => setUsers(response.data))
  }, [])

  const currentMonth = new Date().getMonth() + 1

  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const organizer = users.find((member) => member.name === card.organizerName)
        const canCreate = card.month === currentMonth && !card.event && organizer?.id === user?.id

        return (
          <article key={card.month} className="rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
            <h3 className="font-semibold capitalize">{monthName(card.month)}</h3>
            <p className="text-sm">Organizador: {card.organizerName}</p>
            {card.event ? <p className="text-sm">Evento: {card.event.title}</p> : <p className="text-sm">Sin evento cargado</p>}
            {canCreate ? (
              <button
                type="button"
                className="mt-2 rounded bg-argentina-celeste px-3 py-1 text-white"
                onClick={() => {
                  setSelectedMonth(card.month)
                  setShowCreate(true)
                }}
              >
                {es.createMonthlyEvent}
              </button>
            ) : null}
            {card.event ? (
              <button
                type="button"
                className="mt-2 rounded border border-argentina-celeste px-3 py-1"
                onClick={async () => {
                  const { data } = await api.get<{ hasVoted: boolean }>(`/api/votes/has-voted?eventId=${card.event?.id}`)
                  if (!data.hasVoted && card.event.attendeeIds.includes(user?.id ?? '')) {
                    setVotingEvent(card.event)
                  }
                }}
              >
                {es.rankMonthlyEvent}
              </button>
            ) : null}
            {canCreate ? <p className="mt-2 text-xs text-argentina-celesteDark">{es.monthOrganizerMessage}</p> : null}
          </article>
        )
      })}

      {showCreate && selectedMonth ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md space-y-2 rounded bg-white p-4 dark:bg-argentina-navy"
            onSubmit={async (event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              await api.post(`/api/monthly-events/${selectedMonth}/event`, {
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                eventType: 'monthly_event',
                isExtension: false,
                attendeeIds: String(formData.get('attendees') ?? '')
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
                organizerId: user?.id,
              })
              setShowCreate(false)
              load()
            }}
          >
            <input name="title" placeholder={es.title} className="w-full rounded border p-2" required maxLength={100} />
            <textarea name="description" placeholder={es.description} className="w-full rounded border p-2" required maxLength={500} />
            <input name="date" type="date" className="w-full rounded border p-2" required />
            <input
              name="attendees"
              placeholder="IDs de asistentes separados por coma"
              className="w-full rounded border p-2"
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-1" onClick={() => setShowCreate(false)}>
                {es.cancel}
              </button>
              <button type="submit" className="rounded bg-argentina-celeste px-3 py-1 text-white">
                {es.save}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {votingEvent ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded bg-white p-4 dark:bg-argentina-navy"
            onSubmit={async (event) => {
              event.preventDefault()
              await api.post('/api/votes', { eventId: votingEvent.id, ...scores })
              setVotingEvent(null)
              load()
            }}
          >
            {(['fun', 'cost', 'originality'] as const).map((field) => (
              <label key={field} className="block text-sm">
                {field}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={scores[field]}
                  onChange={(event) =>
                    setScores((prev) => ({
                      ...prev,
                      [field]: Number(event.target.value),
                    }))
                  }
                  className="w-full"
                />
              </label>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-1" onClick={() => setVotingEvent(null)}>
                {es.cancel}
              </button>
              <button type="submit" className="rounded bg-argentina-celeste px-3 py-1 text-white">
                {es.save}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
