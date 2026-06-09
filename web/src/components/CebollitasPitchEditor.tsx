import { Shirt } from 'lucide-react'

import { es } from '../i18n/es'
import { formationSlots } from '../lib/cebollitas'
import { PitchField, TEAM1_SHIRT, TEAM2_SHIRT } from './PitchField'

type Team = 1 | 2

type Props = {
  team1Formation: string
  team2Formation: string
  team1Players: string[]
  team2Players: string[]
  formationOptions: string[]
  onFormationChange: (team: Team, formation: string) => void
  onPlayerChange: (team: Team, index: number, value: string) => void
}

function EditableToken({
  value,
  shirtClass,
  onChange,
}: {
  value: string
  shirtClass: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-16 flex-col items-center gap-1">
      <Shirt size={26} fill="currentColor" className={shirtClass} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={es.player}
        className="w-16 rounded bg-white/90 px-1 py-0.5 text-center text-[11px] text-argentina-navy outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white"
      />
    </div>
  )
}

function TeamControls({
  label,
  color,
  formation,
  options,
  onChange,
}: {
  label: string
  color: string
  formation: string
  options: string[]
  onChange: (formation: string) => void
}) {
  return (
    <div className="z-10 flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white">
        <Shirt size={12} fill="currentColor" className={color} />
        {label}
      </span>
      <select
        value={formation}
        onChange={(e) => onChange(e.target.value)}
        className="rounded bg-black/40 px-1.5 py-0.5 text-xs font-semibold text-white outline-none"
      >
        {options.map((f) => (
          <option key={f} value={f} className="text-argentina-navy">
            {f}
          </option>
        ))}
      </select>
    </div>
  )
}

export function CebollitasPitchEditor({
  team1Formation,
  team2Formation,
  team1Players,
  team2Players,
  formationOptions,
  onFormationChange,
  onPlayerChange,
}: Props) {
  const team1Slots = formationSlots(team1Formation)
  // Team 2 attacks upward, so its goalkeeper sits at the bottom edge.
  const team2Slots = formationSlots(team2Formation).reverse()

  return (
    <PitchField>
      <div className="flex flex-1 flex-col py-1">
        <div className="mb-1">
          <TeamControls
            label={es.team1}
            color={TEAM1_SHIRT}
            formation={team1Formation}
            options={formationOptions}
            onChange={(f) => onFormationChange(1, f)}
          />
        </div>
        <div className="flex flex-1 flex-col justify-around">
          {team1Slots.map((row, i) => (
            <div key={`t1-${i}`} className="flex items-center justify-around">
              {row.map((idx) => (
                <EditableToken
                  key={idx}
                  value={team1Players[idx] ?? ''}
                  shirtClass={TEAM1_SHIRT}
                  onChange={(v) => onPlayerChange(1, idx, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col py-1">
        <div className="flex flex-1 flex-col justify-around">
          {team2Slots.map((row, i) => (
            <div key={`t2-${i}`} className="flex items-center justify-around">
              {row.map((idx) => (
                <EditableToken
                  key={idx}
                  value={team2Players[idx] ?? ''}
                  shirtClass={TEAM2_SHIRT}
                  onChange={(v) => onPlayerChange(2, idx, v)}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1">
          <TeamControls
            label={es.team2}
            color={TEAM2_SHIRT}
            formation={team2Formation}
            options={formationOptions}
            onChange={(f) => onFormationChange(2, f)}
          />
        </div>
      </div>
    </PitchField>
  )
}
