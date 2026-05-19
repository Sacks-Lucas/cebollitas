import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { es } from '../i18n/es'
import { api } from '../services/api'
import type { EventDetail, EventType } from '../types'

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

type Props = {
  eventId: string
  onClose: () => void
}

export function EventDetailModal({ eventId, onClose }: Props) {
  const [detail, setDetail] = useState<EventDetail | null>(null)

  useEffect(() => {
    void api.get<EventDetail>(`/api/events/${eventId}/detail`).then((res) => setDetail(res.data))
  }, [eventId])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-lg bg-white p-4 shadow-xl dark:bg-argentina-navy"
        onClick={(e) => e.stopPropagation()}
      >
        {detail ? (
          <>
            <header className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${eventTypeBadgeClass[detail.eventType]}`}>
                {eventTypeLabel[detail.eventType]}
              </span>
              <h3 className="font-semibold">{detail.title}</h3>
            </header>
            <p className="text-sm">{detail.description}</p>
            <dl className="space-y-1 text-xs">
              <div className="flex flex-wrap gap-1">
                <dt className="font-semibold">{es.attendees}:</dt>
                <dd>{detail.attendees.length > 0 ? detail.attendees.map((a) => a.name).join(', ') : '-'}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{es.organizer}:</dt>
                <dd>{detail.organizer?.name ?? es.noOrganizer}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{es.date}:</dt>
                <dd>{detail.date.slice(0, 10)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="w-full rounded-md border border-argentina-celeste bg-argentina-celeste/10 px-3 py-1.5 text-sm font-semibold text-argentina-celesteDark transition hover:bg-argentina-celeste hover:text-white dark:text-argentina-celeste dark:hover:text-white"
              onClick={onClose}
            >
              {es.close}
            </button>
          </>
        ) : (
          <p>{es.noData}</p>
        )}
      </div>
    </div>,
    document.body,
  )
}
