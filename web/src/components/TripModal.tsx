import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'
import { ImagePlus, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'

import { es } from '../i18n/es'
import { resolveApiUrl } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useUploadTripImage } from '../hooks/useImages'
import type { Trip, User } from '../types'

export const MAX_TRIP_PHOTOS = 3
export const MAX_TRIP_DESTINATIONS = 10

const fieldClass =
  'w-full rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep placeholder:text-gray-400 dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white dark:placeholder:text-argentina-celeste/40'

const checkboxBoxClass =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-argentina-celeste/60 bg-white text-transparent transition peer-checked:border-argentina-celeste peer-checked:bg-argentina-celeste peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-argentina-celeste/40 dark:bg-argentina-navy'

// Local calendar day, so a user in AR isn't blocked from logging a trip that
// ended "today" just because UTC already rolled over.
function todayIso() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const schema = z
  .object({
    title: z.string().trim().min(1, { error: es.titleRequired }).max(100),
    description: z.string().trim().min(1, { error: es.descriptionRequired }).max(1000),
    destinations: z
      .array(z.string().trim().max(200))
      .min(1)
      .max(MAX_TRIP_DESTINATIONS)
      .refine((values) => values.some((value) => value.trim().length > 0), {
        error: es.destinationsRequired,
      }),
    startDate: z.string().min(1, { error: es.startDateRequired }),
    endDate: z.string().min(1, { error: es.endDateRequired }),
    photos: z.array(z.string()).max(MAX_TRIP_PHOTOS),
    attendeeIds: z.array(z.string()).min(4, { error: es.tripMinAttendeesError }),
  })
  .superRefine((values, ctx) => {
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      ctx.addIssue({ code: 'custom', message: es.tripEndBeforeStartError, path: ['endDate'] })
    }
    if (values.endDate && values.endDate > todayIso()) {
      ctx.addIssue({ code: 'custom', message: es.tripEndDateFutureError, path: ['endDate'] })
    }
    const filled = values.destinations.map((value) => value.trim()).filter(Boolean)
    if (new Set(filled).size !== filled.length) {
      ctx.addIssue({ code: 'custom', message: es.destinationsDuplicated, path: ['destinations'] })
    }
  })

type FormValues = z.infer<typeof schema>

type Props = {
  users: User[]
  initial?: Trip
  onClose: () => void
  onSubmit: (values: FormValues) => Promise<void>
}

export function TripModal({ users, initial, onClose, onSubmit }: Props) {
  const { showToast } = useToast()
  const { register, handleSubmit, formState, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          destinations: initial.destinations,
          startDate: initial.startDate.slice(0, 10),
          endDate: initial.endDate.slice(0, 10),
          photos: initial.photos,
          attendeeIds: initial.attendeeIds,
        }
      : {
          title: '',
          description: '',
          destinations: [''],
          startDate: '',
          endDate: '',
          photos: [],
          attendeeIds: [],
        },
  })

  const uploadPhoto = useUploadTripImage()
  const photos = useWatch({ control, name: 'photos' }) ?? []
  const destinations = useWatch({ control, name: 'destinations' }) ?? ['']
  const isSubmitting = formState.isSubmitting
  const isUploading = uploadPhoto.isPending

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || photos.length >= MAX_TRIP_PHOTOS) return
    try {
      const url = await uploadPhoto.mutateAsync(file)
      setValue('photos', [...photos, url], { shouldValidate: true })
    } catch {
      showToast(es.imageUploadError, 'error')
    }
  }

  const addDestination = () => {
    if (destinations.length >= MAX_TRIP_DESTINATIONS) return
    setValue('destinations', [...destinations, ''])
  }

  const removeDestination = (index: number) => {
    const remaining = destinations.filter((_, i) => i !== index)
    setValue('destinations', remaining.length > 0 ? remaining : [''], { shouldValidate: true })
  }

  const removePhoto = (url: string) => {
    setValue(
      'photos',
      photos.filter((photo) => photo !== url),
      { shouldValidate: true },
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={isSubmitting || isUploading ? undefined : onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(async (values) => {
          // Blank rows are just unused slots in the UI — never send them.
          const destinations = values.destinations.map((value) => value.trim()).filter(Boolean)
          await onSubmit({ ...values, destinations })
          onClose()
        })}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="shrink-0 border-b border-argentina-celeste/20 px-4 py-3 dark:border-argentina-celeste/20">
          <h3 className="text-lg font-semibold">{initial ? es.editTrip : es.createTrip}</h3>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="space-y-1">
            <input {...register('title')} placeholder={es.title} className={fieldClass} />
            {formState.errors.title ? (
              <p className="text-sm text-red-600">{formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <textarea
              {...register('description')}
              placeholder={es.description}
              rows={5}
              className={`${fieldClass} min-h-[7rem] resize-y`}
            />
            {formState.errors.description ? (
              <p className="text-sm text-red-600">{formState.errors.description.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{es.destinations}</label>
            <div className="space-y-2">
              {destinations.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <MapPin size={16} className="shrink-0 text-argentina-celesteDark dark:text-argentina-celeste" />
                  <input
                    {...register(`destinations.${index}`)}
                    placeholder={es.destination}
                    className={fieldClass}
                  />
                  {destinations.length > 1 ? (
                    <button
                      type="button"
                      aria-label={es.removeDestination}
                      title={es.removeDestination}
                      onClick={() => removeDestination(index)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-red-600 transition hover:bg-red-500/10 dark:text-red-400 sm:h-8 sm:w-8"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {destinations.length < MAX_TRIP_DESTINATIONS ? (
              <button
                type="button"
                onClick={addDestination}
                className="inline-flex items-center gap-1 rounded border border-argentina-celeste/60 px-3 py-2.5 text-sm text-argentina-celesteDark transition hover:bg-argentina-celeste/10 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20 sm:py-1"
              >
                <Plus size={14} /> {es.addDestination}
              </button>
            ) : null}
            <p className="text-xs opacity-70">{es.destinationsHint}</p>
            {formState.errors.destinations ? (
              <p className="text-sm text-red-600">
                {formState.errors.destinations.message ?? es.destinationsRequired}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="trip-start-date" className="block text-sm font-medium">
                {es.startDate}
              </label>
              <input id="trip-start-date" {...register('startDate')} type="date" className={fieldClass} />
              {formState.errors.startDate ? (
                <p className="text-sm text-red-600">{formState.errors.startDate.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label htmlFor="trip-end-date" className="block text-sm font-medium">
                {es.endDate}
              </label>
              <input
                id="trip-end-date"
                {...register('endDate')}
                type="date"
                max={todayIso()}
                className={fieldClass}
              />
              {formState.errors.endDate ? (
                <p className="text-sm text-red-600">{formState.errors.endDate.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{es.tripPhotos}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo}
                  className="relative aspect-video overflow-hidden rounded border border-argentina-celeste/40"
                >
                  <img src={resolveApiUrl(photo)} alt={es.tripPhotos} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={es.removePhoto}
                    title={es.removePhoto}
                    onClick={() => removePhoto(photo)}
                    className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded bg-black/60 text-white transition hover:bg-red-600 sm:h-7 sm:w-7"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_TRIP_PHOTOS ? (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-argentina-celeste/40 p-2 text-center text-xs text-argentina-celesteDark transition hover:border-argentina-celeste hover:bg-argentina-celeste/10 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20">
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{es.uploadingImage}</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={18} />
                      <span>{es.addPhoto}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                  />
                </label>
              ) : null}
            </div>
            <p className="text-xs opacity-70">{es.tripPhotosHint}</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{es.attendees}</label>
            <div className="grid grid-cols-2 gap-1 rounded border border-argentina-celeste/40 p-2 dark:border-argentina-celeste/40">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 text-sm transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20 sm:py-1.5"
                >
                  <input type="checkbox" value={user.id} {...register('attendeeIds')} className="peer sr-only" />
                  <span className={checkboxBoxClass}>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <polyline points="4 11 8 14 16 6" />
                    </svg>
                  </span>
                  {user.name}
                </label>
              ))}
            </div>
            {formState.errors.attendeeIds ? (
              <p className="text-sm text-red-600">{formState.errors.attendeeIds.message}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-argentina-celeste/20 bg-white p-4 dark:border-argentina-celeste/20 dark:bg-argentina-navy">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="rounded border border-argentina-celeste/60 px-3 py-2 text-argentina-celesteDark transition hover:bg-argentina-celeste/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20 sm:py-1"
          >
            {es.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex min-w-[6rem] items-center justify-center gap-2 rounded bg-argentina-celeste px-3 py-2 text-white transition hover:bg-argentina-celesteDark disabled:cursor-not-allowed disabled:opacity-70 sm:py-1"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {es.save}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
