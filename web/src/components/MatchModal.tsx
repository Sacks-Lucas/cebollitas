import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

import { es } from '../i18n/es'
import type { Match, MatchResult, User } from '../types'

const fieldClass =
  'w-full rounded border border-argentina-celeste/40 bg-white p-2 text-argentina-navyDeep placeholder:text-gray-400 dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white dark:placeholder:text-argentina-celeste/40'

const labelClass = 'mb-1 block text-sm font-medium text-argentina-navy/80 dark:text-gray-300'

const resultLabels: Record<MatchResult, string> = {
  win: es.matchResultWin,
  draw: es.matchResultDraw,
  loss: es.matchResultLoss,
}

const resultChipClass: Record<MatchResult, string> = {
  win: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  draw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  loss: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

// Result filter options, in the requested order: Victoria, Empate, Derrota.
const resultOptions: MatchResult[] = ['win', 'draw', 'loss']

// Local (not UTC) YYYY-MM-DD for the date upper bound, so "today" matches the
// user's calendar regardless of timezone.
const localToday = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const schema = z.object({
  result: z.enum(['win', 'draw', 'loss'], { error: es.resultRequired }),
  goals: z.coerce.number({ error: es.goalsRequired }).int().min(0, { error: es.goalsRequired }),
  stadium: z.string().trim().min(1, { error: es.stadiumRequired }).max(200),
  date: z
    .string()
    .min(1, { error: es.dateRequired })
    .refine((value) => Number(value.slice(0, 4)) === new Date().getFullYear(), { error: es.dateCurrentYearError })
    .refine((value) => value <= localToday(), { error: es.dateFutureError }),
  userId: z.string(),
})

type FormValues = z.infer<typeof schema>

export type MatchSubmitValues = {
  result: MatchResult
  goals: number
  stadium: string | null
  date: string
  userId: string | null
}

type Props = {
  players: User[]
  isAdmin: boolean
  initial?: Match
  onClose: () => void
  onSubmit: (values: MatchSubmitValues) => Promise<void>
}

export function MatchModal({ players, isAdmin, initial, onClose, onSubmit }: Props) {
  const isEdit = Boolean(initial)
  // Admin picks the player only when creating; on edit the owner is fixed.
  const showPlayerPicker = isAdmin && !isEdit

  const { register, handleSubmit, formState } = useForm<FormValues>({
    // zodResolver's inferred types can sometimes be incompatible with our
    // FormValues (notably around z.coerce.number). Cast to any to satisfy TS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: initial
      ? {
          result: initial.result,
          goals: initial.goals ?? 0,
          stadium: initial.stadium ?? '',
          date: initial.date.slice(0, 10),
          userId: initial.userId,
        }
      : { result: 'win', goals: 0, stadium: '', date: '', userId: '' },
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
          await onSubmit({
            result: values.result,
            goals: values.goals,
            stadium: values.stadium.trim() === '' ? null : values.stadium.trim(),
            date: values.date,
            userId: values.userId === '' ? null : values.userId,
          })
          onClose()
        })}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="border-b border-argentina-celeste/20 p-4">
          <h3 className="text-lg font-semibold">{isEdit ? es.editMatch : es.createMatch}</h3>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {showPlayerPicker ? (
            <div>
              <label className={labelClass}>{es.matchPlayer}</label>
              <select {...register('userId')} className={fieldClass}>
                <option value="" />
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className={labelClass}>{es.matchResult}</label>
            {isEdit && initial ? (
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${resultChipClass[initial.result]}`}
                >
                  {resultLabels[initial.result]}
                </span>
              </div>
            ) : (
              <select {...register('result')} className={fieldClass}>
                {resultOptions.map((value) => (
                  <option key={value} value={value}>
                    {resultLabels[value]}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>{es.matchGoals}</label>
            <input {...register('goals')} type="number" min={0} className={fieldClass} />
            {formState.errors.goals ? (
              <p className="mt-1 text-sm text-red-600">{formState.errors.goals.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>{es.matchStadium}</label>
            <input {...register('stadium')} placeholder={es.matchStadium} className={fieldClass} />
            {formState.errors.stadium ? (
              <p className="mt-1 text-sm text-red-600">{formState.errors.stadium.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>{es.matchDate}</label>
            <input {...register('date')} type="date" max={localToday()} className={fieldClass} />
            {formState.errors.date ? (
              <p className="mt-1 text-sm text-red-600">{formState.errors.date.message}</p>
            ) : null}
          </div>
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
