import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

import { es } from '../i18n/es'
import { CANCHA_FORMATIONS, CANCHA_OPTIONS } from '../lib/cebollitas'
import { CebollitasPitchEditor } from './CebollitasPitchEditor'
import type { Cancha, CebollitasMatch, CebollitasMatchPayload, User } from '../types'

const fieldClass =
  'w-full rounded border border-argentina-celeste/40 bg-white p-2 text-sm text-argentina-navyDeep placeholder:text-gray-400 dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white dark:placeholder:text-argentina-celeste/40'
const labelClass = 'mb-1 block text-sm font-medium text-argentina-navy/80 dark:text-gray-300'

const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const resize = (arr: string[], n: number): string[] => {
  const out = arr.slice(0, n)
  while (out.length < n) out.push('')
  return out
}

const teamSchema = z.object({
  formation: z.string(),
  players: z.array(z.string()),
})

const schema = z
  .object({
    date: z
      .string()
      .min(1, { error: es.dateRequired })
      .refine((v) => Number(v.slice(0, 4)) === new Date().getFullYear(), { error: es.dateCurrentYearError })
      .refine((v) => v <= localToday(), { error: es.dateFutureError }),
    cancha: z.number(),
    team1: teamSchema,
    team2: teamSchema,
    winner: z.enum(['team1', 'draw', 'team2']),
    figura: z.string(),
    organizerId: z.string().min(1, { error: es.organizerRequired }),
  })
  .superRefine((val, ctx) => {
    for (const key of ['team1', 'team2'] as const) {
      const players = val[key].players.map((p) => p.trim())
      if (players.length !== val.cancha || players.some((p) => !p)) {
        ctx.addIssue({ code: 'custom', message: es.cebollitasPlayersRequired, path: [key, 'players'] })
      }
    }
  })

type FormValues = z.infer<typeof schema>

type Props = {
  organizers: User[]
  initial?: CebollitasMatch
  onClose: () => void
  onSubmit: (payload: CebollitasMatchPayload) => Promise<void>
}

export function CebollitasMatchModal({ organizers, initial, onClose, onSubmit }: Props) {
  const initCancha: Cancha = initial?.cancha ?? 5

  const { register, handleSubmit, control, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: initial?.date.slice(0, 10) ?? '',
      cancha: initCancha,
      team1: initial?.team1 ?? { formation: CANCHA_FORMATIONS[initCancha][0], players: Array(initCancha).fill('') },
      team2: initial?.team2 ?? { formation: CANCHA_FORMATIONS[initCancha][0], players: Array(initCancha).fill('') },
      winner: initial?.winner ?? 'team1',
      figura: initial?.figura ?? '',
      organizerId: initial?.organizerId ?? '',
    },
  })

  const cancha = useWatch({ control, name: 'cancha' }) as Cancha
  const team1 = useWatch({ control, name: 'team1' })
  const team2 = useWatch({ control, name: 'team2' })
  const isSubmitting = formState.isSubmitting

  const onCanchaChange = (value: Cancha) => {
    setValue('cancha', value)
    setValue('team1.formation', CANCHA_FORMATIONS[value][0])
    setValue('team2.formation', CANCHA_FORMATIONS[value][0])
    setValue('team1.players', resize(team1.players, value))
    setValue('team2.players', resize(team2.players, value))
  }

  const onFormationChange = (team: 1 | 2, value: string) => {
    setValue(team === 1 ? 'team1.formation' : 'team2.formation', value)
  }

  const onPlayerChange = (team: 1 | 2, idx: number, value: string) => {
    const players = [...(team === 1 ? team1 : team2).players]
    players[idx] = value
    setValue(team === 1 ? 'team1.players' : 'team2.players', players, { shouldValidate: false })
  }

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        date: values.date,
        cancha: values.cancha as Cancha,
        team1: { formation: values.team1.formation, players: values.team1.players.map((p) => p.trim()) },
        team2: { formation: values.team2.formation, players: values.team2.players.map((p) => p.trim()) },
        winner: values.winner,
        figura: values.figura.trim() || null,
        organizerId: values.organizerId,
      })
      onClose()
    } catch {
      // parent surfaces the toast
    }
  })

  const playersError = formState.errors.team1?.players || formState.errors.team2?.players

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={isSubmitting ? undefined : onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="border-b border-argentina-celeste/20 p-4">
          <h3 className="text-lg font-semibold">{initial ? es.editCebollitasMatch : es.createCebollitasMatch}</h3>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>{es.date}</label>
              <input type="date" max={localToday()} {...register('date')} className={fieldClass} />
              {formState.errors.date ? <p className="mt-1 text-sm text-red-600">{formState.errors.date.message}</p> : null}
            </div>
            <div>
              <label className={labelClass}>{es.cancha}</label>
              <select value={cancha} onChange={(e) => onCanchaChange(Number(e.target.value) as Cancha)} className={fieldClass}>
                {CANCHA_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {es.canchaOption.replace('{n}', String(c))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{es.winner}</label>
              <select {...register('winner')} className={fieldClass}>
                <option value="team1">{es.team1}</option>
                <option value="draw">{es.resultDraw}</option>
                <option value="team2">{es.team2}</option>
              </select>
            </div>
          </div>

          <CebollitasPitchEditor
            team1Formation={team1.formation}
            team2Formation={team2.formation}
            team1Players={team1.players}
            team2Players={team2.players}
            formationOptions={CANCHA_FORMATIONS[cancha]}
            onFormationChange={onFormationChange}
            onPlayerChange={onPlayerChange}
          />
          {playersError ? <p className="text-sm text-red-600">{es.cebollitasPlayersRequired}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{es.figura}</label>
              <input {...register('figura')} placeholder={es.figura} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>{es.organizer}</label>
              <select {...register('organizerId')} className={fieldClass}>
                <option value="">—</option>
                {organizers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {formState.errors.organizerId ? (
                <p className="mt-1 text-sm text-red-600">{formState.errors.organizerId.message}</p>
              ) : null}
            </div>
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
