import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { es } from '../i18n/es'
import type { Event, EventType, User } from '../types'

const schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  date: z.string().min(1),
  eventType: z.enum(['regular', 'extended', 'trip']),
  isExtension: z.boolean(),
  attendeeIds: z.array(z.string()).min(4, es.minAttendeesError),
  organizerId: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type Props = {
  users: User[]
  initial?: Event
  onClose: () => void
  onSubmit: (values: FormValues) => Promise<void>
}

export function EventModal({ users, initial, onClose, onSubmit }: Props) {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          date: initial.date.slice(0, 10),
          eventType: initial.eventType === 'monthly_event' ? 'regular' : (initial.eventType as EventType),
          isExtension: initial.isExtension,
          attendeeIds: initial.attendeeIds,
          organizerId: initial.organizerId,
        }
      : { title: '', description: '', date: '', eventType: 'regular', isExtension: false, attendeeIds: [], organizerId: '' },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values)
          onClose()
        })}
        className="w-full max-w-xl space-y-3 rounded-lg bg-white p-4 dark:bg-argentina-navy"
      >
        <input {...register('title')} placeholder={es.title} className="w-full rounded border p-2" />
        <textarea {...register('description')} placeholder={es.description} className="w-full rounded border p-2" />
        <input {...register('date')} type="date" className="w-full rounded border p-2" />
        <select {...register('eventType')} className="w-full rounded border p-2">
          <option value="regular">Regular</option>
          <option value="extended">Plan extendido</option>
          <option value="trip">Viaje</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('isExtension')} /> ¿Es extensión de un plan previo?
        </label>
        <select {...register('organizerId')} className="w-full rounded border p-2">
          <option value="">{es.organizer}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2 rounded border p-2">
          {users.map((user) => (
            <label key={user.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={user.id} {...register('attendeeIds')} /> {user.name}
            </label>
          ))}
        </div>
        {formState.errors.attendeeIds ? (
          <p className="text-sm text-red-600">{formState.errors.attendeeIds.message}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">
            {es.cancel}
          </button>
          <button type="submit" className="rounded bg-argentina-celeste px-3 py-1 text-white">
            {es.save}
          </button>
        </div>
      </form>
    </div>
  )
}
