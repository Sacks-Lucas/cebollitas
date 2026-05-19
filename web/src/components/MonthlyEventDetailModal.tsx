import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageIcon } from 'lucide-react'

import { es } from '../i18n/es'
import { api, resolveApiUrl } from '../services/api'
import type { EventDetail, MyVote } from '../types'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

type Props = {
  eventId: string
  onClose: () => void
}

export function MonthlyEventDetailModal({ eventId, onClose }: Props) {
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const [myVote, setMyVote] = useState<MyVote | null>(null)

  useEffect(() => {
    void api.get<EventDetail>(`/api/events/${eventId}/detail`).then((res) => setDetail(res.data))
    void api
      .get<MyVote | null>(`/api/votes/my-vote?eventId=${eventId}`)
      .then((res) => setMyVote(res.data ?? null))
      .catch(() => setMyVote(null))
  }, [eventId])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
        onClick={(e) => e.stopPropagation()}
      >
        {detail ? (
          <>
            {detail.imageUrl ? (
              <img
                src={resolveApiUrl(detail.imageUrl)}
                alt={detail.title}
                className="h-48 w-full shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-48 w-full shrink-0 items-center justify-center border-b border-argentina-celeste/20 bg-argentina-celeste/5 text-argentina-celesteDark/60 dark:border-argentina-celeste/30 dark:bg-argentina-navyDeep/40 dark:text-argentina-celeste/40">
                <ImageIcon size={48} strokeWidth={1.5} />
              </div>
            )}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <header>
                <p className="text-xs font-semibold uppercase tracking-wide text-argentina-celesteDark dark:text-argentina-celeste">
                  {es.eventTypeMonthly}
                </p>
                <h3 className="text-lg font-semibold">{detail.title}</h3>
              </header>
              <p className="text-sm">{detail.description}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="font-semibold">{es.date}:</dt>
                <dd>{detail.date.slice(0, 10)}</dd>
                <dt className="font-semibold">{es.organizer}:</dt>
                <dd>{detail.organizer?.name ?? es.noOrganizer}</dd>
                {detail.location ? (
                  <>
                    <dt className="font-semibold">{es.location}:</dt>
                    <dd>{detail.location}</dd>
                  </>
                ) : null}
                {detail.amount !== null && detail.amount !== undefined ? (
                  <>
                    <dt className="font-semibold">{es.amount}:</dt>
                    <dd>{currencyFormatter.format(detail.amount)}</dd>
                  </>
                ) : null}
                <dt className="font-semibold">{es.attendees}:</dt>
                <dd>{detail.attendees.length > 0 ? detail.attendees.map((a) => a.name).join(', ') : '-'}</dd>
              </dl>
              <section className="rounded-md border border-argentina-celeste/30 bg-argentina-celeste/10 p-3 dark:border-argentina-celeste/40 dark:bg-argentina-celeste/10">
                <h4 className="mb-2 text-sm font-semibold">{es.myVote}</h4>
                {myVote ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <ScoreCell label={es.voteFieldFun} value={myVote.fun} />
                    <ScoreCell label={es.voteFieldCost} value={myVote.cost} />
                    <ScoreCell label={es.voteFieldOriginality} value={myVote.originality} />
                  </div>
                ) : (
                  <p className="text-xs text-argentina-celesteDark/80 dark:text-argentina-celeste/70">
                    {es.voteNotCast}
                  </p>
                )}
              </section>
            </div>
            <div className="shrink-0 border-t border-argentina-celeste/20 p-3 dark:border-argentina-celeste/20">
              <button
                type="button"
                className="w-full rounded-md border border-argentina-celeste bg-argentina-celeste/10 px-3 py-1.5 text-sm font-semibold text-argentina-celesteDark transition hover:bg-argentina-celeste hover:text-white dark:text-argentina-celeste dark:hover:text-white"
                onClick={onClose}
              >
                {es.close}
              </button>
            </div>
          </>
        ) : (
          <p className="p-4">{es.noData}</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-white/60 px-2 py-1.5 dark:bg-argentina-navyDeep/60">
      <p className="text-[10px] uppercase tracking-wide text-argentina-celesteDark/80 dark:text-argentina-celeste/70">
        {label}
      </p>
      <p className="text-base font-bold text-argentina-celesteDark dark:text-argentina-celeste">{value}</p>
    </div>
  )
}
