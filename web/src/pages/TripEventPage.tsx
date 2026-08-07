import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, MapPin, Pencil, Trash2, Users } from 'lucide-react'

import { es } from '../i18n/es'
import { formatTripDateRange } from '../lib/trips'
import type { Trip } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCreateTrip, useDeleteTrip, useTrips, useUpdateTrip } from '../hooks/useTrips'
import { useUsers } from '../hooks/useUsers'
import { TripModal } from '../components/TripModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageSpinner } from '../components/Spinner'

export function TripEventPage() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: trips = [], isLoading: tripsLoading } = useTrips()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const isInitialLoading = tripsLoading || usersLoading
  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip()
  const deleteTrip = useDeleteTrip()

  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>()
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="rounded bg-argentina-celeste px-3 py-2 text-white transition hover:bg-argentina-celesteDark"
          onClick={() => {
            setEditingTrip(undefined)
            setShowModal(true)
          }}
        >
          {es.createTrip}
        </button>
      </div>

      {isInitialLoading ? (
        <PageSpinner />
      ) : trips.length === 0 ? (
        <p>{es.tripsEmpty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            // Trips seeded before the ABM existed have no creator, so only
            // admins can edit those.
            const canEdit = isAdmin || (Boolean(trip.creatorId) && trip.creatorId === user?.id)
            return (
              <article
                key={trip.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/events/trips/${trip.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/events/trips/${trip.id}`)
                  }
                }}
                className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-argentina-celeste/30 bg-argentina-celeste/10 shadow-md transition hover:shadow-lg hover:ring-1 hover:ring-argentina-celeste/40 dark:border-argentina-celeste/40 dark:bg-argentina-navy"
              >
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 break-words font-semibold">{trip.title}</h3>
                    <div className="flex items-center gap-1">
                      {canEdit ? (
                        <button
                          type="button"
                          aria-label={es.editTrip}
                          title={es.editTrip}
                          className="inline-flex h-10 w-10 items-center justify-center rounded text-argentina-celesteDark hover:bg-argentina-celeste/20 dark:text-argentina-celeste sm:h-8 sm:w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTrip(trip)
                            setShowModal(true)
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                      ) : null}
                      {isAdmin ? (
                        <button
                          type="button"
                          aria-label={es.deleteAction}
                          title={es.deleteAction}
                          className="inline-flex h-10 w-10 items-center justify-center rounded text-red-600 hover:bg-red-500/10 dark:text-red-400 sm:h-8 sm:w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingTrip(trip)
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-argentina-celesteDark dark:text-argentina-celeste/80">
                    <CalendarRange size={14} className="shrink-0" />
                    {formatTripDateRange(trip)}
                  </p>
                  <p className="flex items-start gap-1.5 text-sm text-argentina-celesteDark dark:text-argentina-celeste/80">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 break-words">{trip.destinations.join(' · ')}</span>
                  </p>
                  <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                    <Users size={14} className="shrink-0" />
                    {trip.attendeeIds.length} {es.eventAttendeesCount}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showModal ? (
        <TripModal
          users={users}
          initial={editingTrip}
          onClose={() => setShowModal(false)}
          onSubmit={async (values) => {
            try {
              if (editingTrip) {
                await updateTrip.mutateAsync({ tripId: editingTrip.id, payload: values })
                showToast(es.tripUpdatedSuccess, 'success')
              } else {
                await createTrip.mutateAsync(values)
                showToast(es.tripCreatedSuccess, 'success')
              }
            } catch (err) {
              showToast(es.tripSaveError, 'error')
              throw err
            }
          }}
        />
      ) : null}

      {deletingTrip ? (
        <ConfirmDialog
          title={es.deleteTripTitle}
          message={`${es.deleteTripConfirm}\n\n"${deletingTrip.title}"`}
          confirmLabel={es.deleteAction}
          pendingLabel={es.deletingTrip}
          danger
          isPending={deleteTrip.isPending}
          onCancel={() => setDeletingTrip(null)}
          onConfirm={async () => {
            try {
              await deleteTrip.mutateAsync(deletingTrip.id)
              showToast(es.tripDeletedSuccess, 'success')
              setDeletingTrip(null)
            } catch {
              showToast(es.tripDeleteError, 'error')
            }
          }}
        />
      ) : null}
    </section>
  )
}
