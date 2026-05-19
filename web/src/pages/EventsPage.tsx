import { Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { es } from '../i18n/es'
import { api } from '../services/api'
import type { Event, EventType, User } from '../types'
import { EventDetailModal } from '../components/EventDetailModal'
import { EventModal } from '../components/EventModal'

const eventTypeLabel: Record<EventType, string> = {
  regular: es.eventTypeRegular,
  extended: es.eventTypeExtended,
  monthly_event: es.eventTypeMonthly,
  trip: es.eventTypeTrip,
  sports_bonus: es.eventTypeSportsBonus,
}

const eventTypeBadgeClass: Record<EventType, string> = {
  regular: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  extended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  monthly_event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  trip: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  sports_bonus: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
}

export function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Event | undefined>()
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null)
  const [month, setMonth] = useState('')
  const [eventType, setEventType] = useState('')
  const [attendeeId, setAttendeeId] = useState('')

  const userMap = useMemo(() => new Map(users.map((member) => [member.id, member.name])), [users])

  const load = () => {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    if (eventType) params.set('type', eventType)
    if (attendeeId) params.set('attendeeId', attendeeId)
    void api.get<Event[]>(`/api/events?${params.toString()}`).then((res) => setEvents(res.data))
  }

  useEffect(() => {
    void api.get<User[]>('/api/users').then((res) => setUsers(res.data))
  }, [])

  useEffect(load, [month, eventType, attendeeId])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded border p-2">
          <option value="">{es.filterByMonth}</option>
          {Array.from({ length: 12 }, (_, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {idx + 1}
            </option>
          ))}
        </select>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="rounded border p-2">
          <option value="">{es.filterByType}</option>
          <option value="regular">{es.eventTypeRegular}</option>
          <option value="extended">{es.eventTypeExtended}</option>
          <option value="monthly_event">{es.eventTypeMonthly}</option>
          <option value="trip">{es.eventTypeTrip}</option>
        </select>
        <select value={attendeeId} onChange={(e) => setAttendeeId(e.target.value)} className="rounded border p-2">
          <option value="">{es.filterByAttendee}</option>
          {users.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ml-auto rounded bg-argentina-celeste px-3 py-2 text-white"
          onClick={() => {
            setEditing(undefined)
            setShowModal(true)
          }}
        >
          {es.createEvent}
        </button>
      </div>

      {events.length === 0 ? (
        <p>{es.noData}</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const isOwner = user?.id === event.creatorId
            const isMonthly = event.eventType === 'monthly_event'
            return (
              <li
                key={event.id}
                {...(isMonthly ? {} : { role: 'button', tabIndex: 0 })}
                onClick={isMonthly ? undefined : () => setDetailsEvent(event)}
                onKeyDown={
                  isMonthly
                    ? undefined
                    : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDetailsEvent(event)
                        }
                      }
                }
                className={`flex flex-col gap-2 rounded-lg border border-argentina-celeste/40 p-4 shadow-lg shadow-argentina-celeste/20 transition dark:border-argentina-celeste/50 dark:shadow-black/60 sm:flex-row sm:items-center sm:justify-between ${
                  isMonthly
                    ? 'bg-argentina-celeste/20 dark:bg-argentina-celeste/10'
                    : 'cursor-pointer bg-white hover:shadow-xl dark:bg-argentina-navy'
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${eventTypeBadgeClass[event.eventType]}`}>
                      {eventTypeLabel[event.eventType]}
                    </span>
                    <h3 className="truncate font-semibold">{event.title}</h3>
                  </div>
                  <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                    {event.date.slice(0, 10)} · {es.organizer}: {userMap.get(event.organizerId ?? '') ?? es.noOrganizer} · {event.attendeeIds.length} {es.eventAttendeesCount}
                  </p>
                </div>
                {isOwner ? (
                  <button
                    type="button"
                    aria-label={es.actions}
                    className="self-end rounded p-1 hover:bg-argentina-celeste/20 sm:self-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditing(event)
                      setShowModal(true)
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {showModal ? (
        <EventModal
          users={users}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSubmit={async (values) => {
            const payload = {
              ...values,
              eventType: values.isExtension ? ('extended' as EventType) : values.eventType,
            }
            if (editing) {
              await api.put(`/api/events/${editing.id}`, payload)
            } else {
              await api.post('/api/events', payload)
            }
            load()
          }}
        />
      ) : null}

      {detailsEvent ? (
        <EventDetailModal eventId={detailsEvent.id} onClose={() => setDetailsEvent(null)} />
      ) : null}
    </section>
  )
}
