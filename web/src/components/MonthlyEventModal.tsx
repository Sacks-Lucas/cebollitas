import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { es } from '../i18n/es'
import { api, resolveApiUrl } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import type { Event, User } from '../types'

const fieldClass =
  'w-full rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep placeholder:text-gray-400 dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white dark:placeholder:text-argentina-celeste/40'

const checkboxBoxClass =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-argentina-celeste/60 bg-white text-transparent transition peer-checked:border-argentina-celeste peer-checked:bg-argentina-celeste peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-argentina-celeste/40 dark:bg-argentina-navy'

const schema = z.object({
  title: z.string().trim().min(1, { error: es.titleRequired }).max(100),
  description: z.string().trim().min(1, { error: es.descriptionRequired }).max(1000),
  date: z
    .string()
    .min(1, { error: es.dateRequired })
    .refine((value) => Number(value.slice(0, 4)) === new Date().getFullYear(), {
      error: es.dateCurrentYearError,
    }),
  location: z.string().trim().min(1, { error: es.locationRequired }).max(200),
  amount: z.coerce.number({ error: es.amountRequired }).min(0, { error: es.amountRequired }),
  imageUrl: z.string().min(1, { error: es.imageRequired }),
  attendeeIds: z.array(z.string()).min(4, { error: es.minAttendeesError }),
})

type FormValues = z.infer<typeof schema>

type Props = {
  month: number
  monthLabel: string
  organizerName: string
  users: User[]
  initial?: Event
  onClose: () => void
  onSubmit: (values: FormValues) => Promise<void>
}

export function MonthlyEventModal({ month, monthLabel, organizerName, users, initial, onClose, onSubmit }: Props) {
  const { showToast } = useToast()
  const { register, handleSubmit, formState, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          date: initial.date.slice(0, 10),
          location: initial.location ?? '',
          amount: initial.amount ?? 0,
          imageUrl: initial.imageUrl ?? '',
          attendeeIds: initial.attendeeIds,
        }
      : {
          title: '',
          description: '',
          date: '',
          location: '',
          amount: 0,
          imageUrl: '',
          attendeeIds: [],
        },
  })

  const [isUploading, setIsUploading] = useState(false)
  const imageUrl = useWatch({ control, name: 'imageUrl' })
  const isSubmitting = formState.isSubmitting

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ url: string }>('/api/monthly-events/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setValue('imageUrl', data.url, { shouldValidate: true })
    } catch {
      showToast(es.imageUploadError, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const clearImage = () => setValue('imageUrl', '', { shouldValidate: true })

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={isSubmitting || isUploading ? undefined : onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values)
          onClose()
        })}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="shrink-0 border-b border-argentina-celeste/20 px-4 py-3 dark:border-argentina-celeste/20">
          <h3 className="text-lg font-semibold capitalize">
            {initial ? `${es.eventTypeMonthly} — ${monthLabel}` : `${es.createMonthlyEvent} — ${monthLabel}`}
          </h3>
          <p className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
            {es.organizer}: {organizerName} · #{month}
          </p>
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
              rows={6}
              className={`${fieldClass} min-h-[8rem] resize-y`}
            />
            {formState.errors.description ? (
              <p className="text-sm text-red-600">{formState.errors.description.message}</p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <input {...register('date')} type="date" className={fieldClass} />
              {formState.errors.date ? (
                <p className="text-sm text-red-600">{formState.errors.date.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                min={0}
                placeholder={es.amount}
                className={fieldClass}
              />
              {formState.errors.amount ? (
                <p className="text-sm text-red-600">{formState.errors.amount.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <input {...register('location')} placeholder={es.location} className={fieldClass} />
            {formState.errors.location ? (
              <p className="text-sm text-red-600">{formState.errors.location.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{es.image}</label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={resolveApiUrl(imageUrl)}
                  alt={es.image}
                  className="max-h-48 w-full rounded border border-argentina-celeste/40 object-cover"
                />
                <div className="mt-2 flex gap-2">
                  <label className="flex cursor-pointer items-center gap-1 rounded border border-argentina-celeste/60 px-3 py-1 text-sm text-argentina-celesteDark hover:bg-argentina-celeste/10 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20">
                    <ImagePlus size={14} /> {es.changeImage}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="flex items-center gap-1 rounded border border-red-500/60 px-3 py-1 text-sm text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> {es.removeImage}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-argentina-celeste/40 p-6 text-center text-sm text-argentina-celesteDark transition hover:border-argentina-celeste hover:bg-argentina-celeste/10 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20">
                {isUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={20} />
                    <span>{es.uploadImage}</span>
                    <span className="text-xs opacity-70">JPG, PNG o WEBP · máx 5 MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
              </label>
            )}
            {formState.errors.imageUrl ? (
              <p className="text-sm text-red-600">{formState.errors.imageUrl.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded border border-argentina-celeste/40 p-2 dark:border-argentina-celeste/40">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20"
              >
                <input
                  type="checkbox"
                  value={user.id}
                  {...register('attendeeIds')}
                  className="peer sr-only"
                />
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
        <div className="flex shrink-0 justify-end gap-2 border-t border-argentina-celeste/20 bg-white p-4 dark:border-argentina-celeste/20 dark:bg-argentina-navy">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="rounded border border-argentina-celeste/60 px-3 py-1 text-argentina-celesteDark transition hover:bg-argentina-celeste/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20"
          >
            {es.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex min-w-[6rem] items-center justify-center gap-2 rounded bg-argentina-celeste px-3 py-1 text-white transition hover:bg-argentina-celesteDark disabled:cursor-not-allowed disabled:opacity-70"
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
