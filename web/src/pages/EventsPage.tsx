import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { es } from '../i18n/es'
import { useCreateEvent, useEvents, useUpdateEvent } from '../hooks/useEvents'
import { useTrips } from '../hooks/useTrips'
import { useUsers } from '../hooks/useUsers'
import type { Event, EventType, Trip } from '../types'
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

type ListItem =
  | { kind: 'event'; data: Event; sortKey: string }
  | { kind: 'trip'; data: Trip; sortKey: string }

export function EventsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Event | undefined>()
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null)
  const [month, setMonth] = useState('')
  const [eventType, setEventType] = useState('')
  const [attendeeId, setAttendeeId] = useState('')

  const { data: events = [] } = useEvents({ month, type: eventType, attendeeId })
  const { data: trips = [] } = useTrips({ month, attendeeId })
  const { data: users = [] } = useUsers()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const userMap = useMemo(() => new Map(users.map((member) => [member.id, member.name])), [users])

  const items: ListItem[] = useMemo(() => {
    const eventItems: ListItem[] = events.map((event) => ({
      kind: 'event',
      data: event,
      sortKey: `${event.date}|${event.createdAt}`,
    }))
    const visibleTrips = eventType && eventType !== 'trip' ? [] : trips
    const tripItems: ListItem[] = visibleTrips.map((trip) => ({
      kind: 'trip',
      data: trip,
      sortKey: `${trip.startDate}|${trip.createdAt}`,
    }))
    return [...eventItems, ...tripItems].sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [events, trips, eventType])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white"
        >
          <option value="">{es.filterByMonth}</option>
          {es.months.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white"
        >
          <option value="">{es.filterByType}</option>
          <option value="regular">{es.eventTypeRegular}</option>
          <option value="extended">{es.eventTypeExtended}</option>
          <option value="monthly_event">{es.eventTypeMonthly}</option>
          <option value="trip">{es.eventTypeTrip}</option>
        </select>
        <select
          value={attendeeId}
          onChange={(e) => setAttendeeId(e.target.value)}
          className="rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white"
        >
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

      {items.length === 0 ? (
        <p>{es.noData}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            if (item.kind === 'trip') {
              const trip = item.data
              const sameDay = trip.startDate === trip.endDate
              const dateText = sameDay
                ? trip.startDate.slice(0, 10)
                : `${trip.startDate.slice(0, 10)} → ${trip.endDate.slice(0, 10)}`
              return (
                <li
                  key={`trip-${trip.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-argentina-celeste/40 bg-green-50 p-4 shadow-lg shadow-argentina-celeste/20 transition dark:border-argentina-celeste/50 dark:bg-green-900/20 dark:shadow-black/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${eventTypeBadgeClass.trip}`}>
                        {eventTypeLabel.trip}
                      </span>
                      <h3 className="truncate font-semibold">{trip.title}</h3>
                    </div>
                    <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                      {dateText} · {es.destination}: {trip.destination} · {trip.attendeeIds.length} {es.eventAttendeesCount}
                    </p>
                  </div>
                </li>
              )
            }

            const event = item.data
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
            const isEditing = Boolean(editing)
            try {
              if (editing) {
                await updateEvent.mutateAsync({ id: editing.id, payload: values as never })
              } else {
                await createEvent.mutateAsync(values as never)
              }
              showToast(isEditing ? es.eventUpdatedSuccess : es.eventCreatedSuccess, 'success')
            } catch (err) {
              showToast(es.eventSaveError, 'error')
              throw err
            }
          }}
        />
      ) : null}

      {detailsEvent ? (
        <EventDetailModal eventId={detailsEvent.id} onClose={() => setDetailsEvent(null)} />
      ) : null}
    </section>
  )
}
