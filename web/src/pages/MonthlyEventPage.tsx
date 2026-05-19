import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageIcon, Pencil } from 'lucide-react'

import { es } from '../i18n/es'
import { api, resolveApiUrl } from '../services/api'
import type { Event, MonthlyEventCard, User } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { MonthlyEventModal } from '../components/MonthlyEventModal'
import { MonthlyEventDetailModal } from '../components/MonthlyEventDetailModal'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

function monthName(month: number) {
  return new Date(2026, month - 1, 1).toLocaleString('es-AR', { month: 'long' })
}

const VOTING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function isVotingClosed(event: Event): boolean {
  return Date.now() - new Date(event.createdAt).getTime() > VOTING_WINDOW_MS
}

export function MonthlyEventPage() {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const [cards, setCards] = useState<MonthlyEventCard[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [editingCard, setEditingCard] = useState<{ card: MonthlyEventCard; event?: Event } | null>(null)
  const [votingEvent, setVotingEvent] = useState<Event | null>(null)
  const [scores, setScores] = useState({ fun: 5, cost: 5, originality: 5 })
  const [isVoting, setIsVoting] = useState(false)
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null)

  const openVoteModal = (event: Event) => {
    setScores({ fun: 5, cost: 5, originality: 5 })
    setVotingEvent(event)
  }
  const [votedStatus, setVotedStatus] = useState<Record<string, boolean>>({})

  const load = () => {
    void api.get<MonthlyEventCard[]>('/api/monthly-events').then((response) => setCards(response.data))
  }

  useEffect(() => {
    load()
    void api.get<User[]>('/api/users').then((response) => setUsers(response.data))
  }, [])

  useEffect(() => {
    const eventIds = cards.map((card) => card.event?.id).filter((id): id is string => Boolean(id))
    if (eventIds.length === 0) return
    void Promise.all(
      eventIds.map((id) =>
        api
          .get<{ hasVoted: boolean }>(`/api/votes/has-voted?eventId=${id}`)
          .then((response) => [id, response.data.hasVoted] as const),
      ),
    ).then((results) => setVotedStatus(Object.fromEntries(results)))
  }, [cards])

  const currentMonth = new Date().getMonth() + 1
  const voteLabels = {
    fun: es.voteFieldFun,
    cost: es.voteFieldCost,
    originality: es.voteFieldOriginality,
  } as const

  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const organizer = users.find((member) => member.name === card.organizerName)
        const isAssignedOrganizer = organizer?.id === user?.id
        const canCreateNow = !card.event && (isAdmin || (isAssignedOrganizer && card.month === currentMonth))
        const isCreator = card.event && card.event.creatorId === user?.id
        const canEditEvent = Boolean(card.event) && (isAdmin || isAssignedOrganizer || isCreator)
        const canVote =
          card.event &&
          card.event.attendeeIds.includes(user?.id ?? '') &&
          !votedStatus[card.event.id] &&
          !isVotingClosed(card.event)

        const isClickable = Boolean(card.event)
        return (
          <article
            key={card.month}
            {...(isClickable ? { role: 'button', tabIndex: 0 } : {})}
            onClick={isClickable ? () => setDetailsEvent(card.event!) : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDetailsEvent(card.event!)
                    }
                  }
                : undefined
            }
            className={`flex flex-col overflow-hidden rounded-lg border border-argentina-celeste/30 bg-argentina-celeste/10 shadow-md transition dark:border-argentina-celeste/40 dark:bg-argentina-navy ${
              isClickable ? 'cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-argentina-celeste/40' : ''
            }`}
          >
            {card.event?.imageUrl ? (
              <img
                src={resolveApiUrl(card.event.imageUrl)}
                alt={card.event.title}
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center border-b border-argentina-celeste/20 bg-argentina-celeste/5 text-argentina-celesteDark/60 dark:border-argentina-celeste/30 dark:bg-argentina-navyDeep/40 dark:text-argentina-celeste/40">
                <ImageIcon size={36} strokeWidth={1.5} />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold capitalize">{monthName(card.month)}</h3>
                {canEditEvent ? (
                  <button
                    type="button"
                    aria-label={es.actions}
                    className="rounded p-1 text-argentina-celesteDark hover:bg-argentina-celeste/20 dark:text-argentina-celeste"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCard({ card, event: card.event ?? undefined })
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                ) : null}
              </div>
              <p className="text-sm">Organizador: {card.organizerName}</p>
              {card.event ? (
                <>
                  <p className="text-sm font-medium">{card.event.title}</p>
                  {card.event.location ? (
                    <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                      {es.location}: {card.event.location}
                    </p>
                  ) : null}
                  {card.event.amount !== null && card.event.amount !== undefined ? (
                    <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                      {es.amount}: {currencyFormatter.format(card.event.amount)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm">Sin evento cargado</p>
              )}
              {isAssignedOrganizer && card.month === currentMonth && !card.event ? (
                <p className="mt-2 text-xs text-argentina-celesteDark">{es.monthOrganizerMessage}</p>
              ) : null}
              <div className="mt-auto pt-3">
                {canCreateNow ? (
                  <button
                    type="button"
                    className="w-full rounded bg-argentina-celeste px-3 py-1.5 text-white transition hover:bg-argentina-celesteDark"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCard({ card })
                    }}
                  >
                    {es.createMonthlyEvent}
                  </button>
                ) : null}
                {canVote && card.event ? (
                  <button
                    type="button"
                    className="w-full rounded border border-argentina-celeste px-3 py-1.5 transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      openVoteModal(card.event!)
                    }}
                  >
                    {es.rankMonthlyEvent}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}

      {editingCard ? (
        <MonthlyEventModal
          month={editingCard.card.month}
          monthLabel={monthName(editingCard.card.month)}
          organizerName={editingCard.card.organizerName}
          users={users}
          initial={editingCard.event}
          onClose={() => setEditingCard(null)}
          onSubmit={async (values) => {
            const organizer = users.find((member) => member.name === editingCard.card.organizerName)
            const isAssignedOrganizer = organizer?.id === user?.id
            const payload = {
              ...values,
              eventType: 'monthly_event',
              organizerId: organizer?.id ?? null,
            }
            try {
              if (editingCard.event) {
                await api.put(`/api/monthly-events/${editingCard.event.id}`, payload)
                showToast(es.eventUpdatedSuccess, 'success')
              } else {
                const useAdminEndpoint = isAdmin && !isAssignedOrganizer
                const path = useAdminEndpoint
                  ? `/api/admin/monthly-events/${editingCard.card.month}/event`
                  : `/api/monthly-events/${editingCard.card.month}/event`
                await api.post(path, payload)
                showToast(es.eventCreatedSuccess, 'success')
              }
              load()
            } catch (err) {
              showToast(es.eventSaveError, 'error')
              throw err
            }
          }}
        />
      ) : null}

      {detailsEvent ? (
        <MonthlyEventDetailModal eventId={detailsEvent.id} onClose={() => setDetailsEvent(null)} />
      ) : null}

      {votingEvent
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={isVoting ? undefined : () => setVotingEvent(null)}
            >
              <form
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setIsVoting(true)
                  try {
                    await api.post('/api/votes', { eventId: votingEvent.id, ...scores })
                    showToast(es.voteSavedSuccess, 'success')
                    setVotingEvent(null)
                    load()
                  } catch {
                    showToast(es.voteSaveError, 'error')
                  } finally {
                    setIsVoting(false)
                  }
                }}
              >
                <header className="border-b border-argentina-celeste/20 px-5 py-3 dark:border-argentina-celeste/20">
                  <h3 className="text-lg font-semibold">{es.rankMonthlyEvent}</h3>
                  <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                    {votingEvent.title}
                  </p>
                  <p className="mt-1 text-xs text-argentina-celesteDark/80 dark:text-argentina-celeste/60">
                    {es.voteHint}
                  </p>
                </header>
                <div className="space-y-4 px-5 py-4">
                  {(['fun', 'cost', 'originality'] as const).map((field) => (
                    <div key={field}>
                      <div className="mb-1 flex items-center justify-between">
                        <label htmlFor={`vote-${field}`} className="text-sm font-medium">
                          {voteLabels[field]}
                        </label>
                        <span className="rounded-full bg-argentina-celeste/20 px-2 py-0.5 text-xs font-semibold text-argentina-celesteDark dark:text-argentina-celeste">
                          {scores[field]} / 10
                        </span>
                      </div>
                      <input
                        id={`vote-${field}`}
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={scores[field]}
                        onChange={(event) =>
                          setScores((prev) => ({
                            ...prev,
                            [field]: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-argentina-celeste"
                      />
                      <div className="flex justify-between text-[10px] text-argentina-celesteDark/70 dark:text-argentina-celeste/60">
                        <span>1</span>
                        <span>10</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 border-t border-argentina-celeste/20 bg-white px-5 py-3 dark:border-argentina-celeste/20 dark:bg-argentina-navy">
                  <button
                    type="button"
                    onClick={() => setVotingEvent(null)}
                    disabled={isVoting}
                    className="rounded border border-argentina-celeste/60 px-3 py-1 text-argentina-celesteDark transition hover:bg-argentina-celeste/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20"
                  >
                    {es.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isVoting}
                    className="rounded bg-argentina-celeste px-3 py-1 text-white transition hover:bg-argentina-celesteDark disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {es.save}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
