import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

import { es } from '../i18n/es'
import type { Event, EventType, User } from '../types'

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
  eventType: z.enum(['regular', 'extended']),
  attendeeIds: z.array(z.string()).min(4, { error: es.minAttendeesError }),
  organizerId: z.string(),
})

type FormValues = z.infer<typeof schema>
type SubmitValues = Omit<FormValues, 'organizerId'> & { organizerId: string | null }

const editableTypes = new Set<EventType>(['regular', 'extended'])

type Props = {
  users: User[]
  initial?: Event
  onClose: () => void
  onSubmit: (values: SubmitValues) => Promise<void>
}

export function EventModal({ users, initial, onClose, onSubmit }: Props) {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          date: initial.date.slice(0, 10),
          eventType: editableTypes.has(initial.eventType) ? (initial.eventType as 'regular' | 'extended') : 'regular',
          attendeeIds: initial.attendeeIds,
          organizerId: initial.organizerId ?? '',
        }
      : { title: '', description: '', date: '', eventType: 'regular', attendeeIds: [], organizerId: '' },
  })

  const isSubmitting = formState.isSubmitting

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={isSubmitting ? undefined : onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(async (values) => {
          await onSubmit({ ...values, organizerId: values.organizerId === '' ? null : values.organizerId })
          onClose()
        })}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="space-y-1">
            <input
              {...register('title')}
              placeholder={es.title}
              className={fieldClass}
            />
            {formState.errors.title ? (
              <p className="text-sm text-red-600">{formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <textarea
              {...register('description')}
              placeholder={es.description}
              className={fieldClass}
            />
            {formState.errors.description ? (
              <p className="text-sm text-red-600">{formState.errors.description.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <input
              {...register('date')}
              type="date"
              className={fieldClass}
            />
            {formState.errors.date ? (
              <p className="text-sm text-red-600">{formState.errors.date.message}</p>
            ) : null}
          </div>
          <select {...register('eventType')} className={fieldClass}>
            <option value="regular">{es.eventTypeRegular}</option>
            <option value="extended">{es.eventTypeExtended}</option>
          </select>
          <select {...register('organizerId')} className={fieldClass}>
            <option value="">{es.noOrganizer}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
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
            disabled={isSubmitting}
            className="rounded border border-argentina-celeste/60 px-3 py-1 text-argentina-celesteDark transition hover:bg-argentina-celeste/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20"
          >
            {es.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
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
