import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MapPin,
  Pencil,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { es } from '../i18n/es'
import { resolveApiUrl } from '../services/api'
import { formatTripDateRange } from '../lib/trips'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useDeleteTrip, useTrip, useUpdateTrip } from '../hooks/useTrips'
import { useUsers } from '../hooks/useUsers'
import { TripModal } from '../components/TripModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageSpinner } from '../components/Spinner'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: trip, isLoading, isError } = useTrip(tripId)
  const { data: users = [] } = useUsers()
  const updateTrip = useUpdateTrip()
  const deleteTrip = useDeleteTrip()

  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLightboxOpen, setLightboxOpen] = useState(false)

  const photos = trip?.photos ?? []
  const total = photos.length
  // Clamped during render: editing the trip can drop the photo we were looking at.
  const activePhoto = total > 0 ? Math.min(selectedPhoto, total - 1) : 0

  const goToPhoto = (offset: number) => {
    if (total === 0) return
    setSelectedPhoto((activePhoto + offset + total) % total)
  }

  useEffect(() => {
    if (!isLightboxOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') goToPhoto(1)
      if (event.key === 'ArrowLeft') goToPhoto(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, total])

  if (isLoading) {
    return <PageSpinner />
  }

  if (isError || !trip) {
    return (
      <section className="space-y-4 rounded-lg bg-argentina-celeste/10 p-6 text-center dark:bg-argentina-navy">
        <p>{es.tripNotFound}</p>
        <Link
          to="/events/trips"
          className="inline-flex items-center gap-1 rounded border border-argentina-celeste/60 px-3 py-2 text-sm text-argentina-celesteDark transition hover:bg-argentina-celeste/10 dark:text-argentina-celeste"
        >
          <ArrowLeft size={14} /> {es.backToTrips}
        </Link>
      </section>
    )
  }

  const attendeeNames = trip.attendeeIds
    .map((id) => users.find((member) => member.id === id)?.name)
    .filter((name): name is string => Boolean(name))
  const canEdit = isAdmin || (Boolean(trip.creatorId) && trip.creatorId === user?.id)
  const counter = es.tripPhotoCounter
    .replace('{current}', String(activePhoto + 1))
    .replace('{total}', String(total))

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/events/trips"
          className="inline-flex items-center gap-1 py-2.5 text-sm text-argentina-celesteDark transition hover:underline dark:text-argentina-celeste sm:py-0"
        >
          <ArrowLeft size={16} /> {es.backToTrips}
        </Link>
        <div className="flex items-center gap-1">
          {canEdit ? (
            <button
              type="button"
              aria-label={es.editTrip}
              title={es.editTrip}
              onClick={() => setIsEditing(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded text-argentina-celesteDark transition hover:bg-argentina-celeste/20 dark:text-argentina-celeste sm:h-8 sm:w-8"
            >
              <Pencil size={16} />
            </button>
          ) : null}
          {isAdmin ? (
            <button
              type="button"
              aria-label={es.deleteAction}
              title={es.deleteAction}
              onClick={() => setIsDeleting(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded text-red-600 transition hover:bg-red-500/10 dark:text-red-400 sm:h-8 sm:w-8"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {total > 0 ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-argentina-celeste/30 bg-black/5 dark:border-argentina-celeste/40 dark:bg-black/30">
            <button
              type="button"
              aria-label={es.expandPhoto}
              onClick={() => setLightboxOpen(true)}
              className="block w-full cursor-zoom-in"
            >
              <img
                src={resolveApiUrl(photos[activePhoto])}
                alt={`${trip.title} ${activePhoto + 1}`}
                className="max-h-[70vh] w-full object-contain"
              />
            </button>
            {total > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={es.previousPhoto}
                  onClick={() => goToPhoto(-1)}
                  className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label={es.nextPhoto}
                  onClick={() => goToPhoto(1)}
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  {counter}
                </span>
              </>
            ) : null}
          </div>
          {total > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, index) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setSelectedPhoto(index)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded border-2 transition ${
                    index === activePhoto
                      ? 'border-argentina-celeste'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveApiUrl(photo)}
                    alt={`${trip.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-argentina-celeste/20 bg-argentina-celeste/5 text-argentina-celesteDark/60 dark:border-argentina-celeste/30 dark:bg-argentina-navyDeep/40 dark:text-argentina-celeste/40">
          <ImageIcon size={44} strokeWidth={1.5} />
          <p className="text-sm">{es.tripPhotosEmpty}</p>
        </div>
      )}

      <article className="space-y-3 rounded-lg border border-argentina-celeste/30 bg-argentina-celeste/10 p-4 dark:border-argentina-celeste/40 dark:bg-argentina-navy">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-argentina-celesteDark dark:text-argentina-celeste">
            {es.eventTypeTrip}
          </p>
          <h2 className="text-xl font-semibold">{trip.title}</h2>
        </header>
        <p className="flex items-center gap-2 text-sm text-argentina-celesteDark dark:text-argentina-celeste/80">
          <CalendarRange size={16} className="shrink-0" />
          {formatTripDateRange(trip)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <MapPin size={16} className="shrink-0 text-argentina-celesteDark dark:text-argentina-celeste/80" />
          {trip.destinations.map((destination) => (
            <span
              key={destination}
              className="rounded-full bg-argentina-celeste/20 px-2.5 py-1 text-xs font-medium text-argentina-celesteDark dark:text-argentina-celeste"
            >
              {destination}
            </span>
          ))}
        </div>
        <p className="whitespace-pre-line text-sm">{trip.description}</p>
        <div className="space-y-1 border-t border-argentina-celeste/20 pt-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Users size={16} className="shrink-0" />
            {es.attendees} ({trip.attendeeIds.length})
          </p>
          <p className="text-sm text-argentina-celesteDark dark:text-argentina-celeste/80">
            {attendeeNames.length > 0 ? attendeeNames.join(', ') : '-'}
          </p>
        </div>
      </article>

      {isEditing ? (
        <TripModal
          users={users}
          initial={trip}
          onClose={() => setIsEditing(false)}
          onSubmit={async (values) => {
            try {
              await updateTrip.mutateAsync({ tripId: trip.id, payload: values })
              showToast(es.tripUpdatedSuccess, 'success')
            } catch (err) {
              showToast(es.tripSaveError, 'error')
              throw err
            }
          }}
        />
      ) : null}

      {isDeleting ? (
        <ConfirmDialog
          title={es.deleteTripTitle}
          message={`${es.deleteTripConfirm}\n\n"${trip.title}"`}
          confirmLabel={es.deleteAction}
          pendingLabel={es.deletingTrip}
          danger
          isPending={deleteTrip.isPending}
          onCancel={() => setIsDeleting(false)}
          onConfirm={async () => {
            try {
              await deleteTrip.mutateAsync(trip.id)
              showToast(es.tripDeletedSuccess, 'success')
              navigate('/events/trips', { replace: true })
            } catch {
              showToast(es.tripDeleteError, 'error')
            }
          }}
        />
      ) : null}

      {isLightboxOpen && total > 0
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                type="button"
                aria-label={es.close}
                onClick={() => setLightboxOpen(false)}
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={20} />
              </button>
              <img
                src={resolveApiUrl(photos[activePhoto])}
                alt={`${trip.title} ${activePhoto + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full object-contain"
              />
              {total > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label={es.previousPhoto}
                    onClick={(e) => {
                      e.stopPropagation()
                      goToPhoto(-1)
                    }}
                    className="absolute left-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    aria-label={es.nextPhoto}
                    onClick={(e) => {
                      e.stopPropagation()
                      goToPhoto(1)
                    }}
                    className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <ChevronRight size={22} />
                  </button>
                  <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                    {counter}
                  </span>
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
