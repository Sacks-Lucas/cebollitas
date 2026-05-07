import { Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { es } from '../i18n/es'
import { api } from '../services/api'
import type { Event, EventType, User } from '../types'
import { EventModal } from '../components/EventModal'

export function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Event | undefined>()
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

      <div className="overflow-x-auto rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>{es.date}</th>
              <th>{es.title}</th>
              <th>{es.eventType}</th>
              <th>{es.organizer}</th>
              <th>{es.attendees}</th>
              <th>{es.creator}</th>
              <th>{es.actions}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className={event.eventType === 'monthly_event' ? 'bg-argentina-celeste/20' : ''}>
                <td>{event.date.slice(0, 10)}</td>
                <td>{event.title}</td>
                <td>{event.eventType}</td>
                <td>{userMap.get(event.organizerId) ?? '-'}</td>
                <td title={event.attendeeIds.map((id) => userMap.get(id) ?? id).join(', ')}>{event.attendeeIds.length}</td>
                <td>{userMap.get(event.creatorId) ?? '-'}</td>
                <td>
                  {user?.id === event.creatorId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(event)
                        setShowModal(true)
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </section>
  )
}
