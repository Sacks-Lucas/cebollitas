import { Shirt } from 'lucide-react'

import { es } from '../i18n/es'
import { isFigura, playersByRow } from '../lib/cebollitas'
import { PitchField, TEAM1_SHIRT, TEAM2_SHIRT } from './PitchField'
import type { CebollitasMatch } from '../types'

function PlayerToken({ name, shirtClass, figura }: { name: string; shirtClass: string; figura: boolean }) {
  return (
    <div className="flex w-16 flex-col items-center gap-0.5">
      <div className="relative">
        <Shirt size={30} fill="currentColor" className={shirtClass} />
        {figura ? <span className="absolute -right-1.5 -top-1.5 text-sm">⭐</span> : null}
      </div>
      <span className="max-w-[4.5rem] truncate text-center text-[11px] font-medium leading-tight text-white drop-shadow">
        {name}
      </span>
    </div>
  )
}

function TeamRow({ players, shirtClass, figura }: { players: string[]; shirtClass: string; figura: string | null }) {
  return (
    <div className="flex items-center justify-around">
      {players.map((name, i) => (
        <PlayerToken key={`${name}-${i}`} name={name} shirtClass={shirtClass} figura={isFigura(name, figura)} />
      ))}
    </div>
  )
}

function TeamBadge({ label, color, won }: { label: string; color: string; won: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white">
      <Shirt size={12} fill="currentColor" className={color} />
      {label}
      {won ? <span>🏆</span> : null}
    </span>
  )
}

export function CebollitasPitch({ match }: { match: CebollitasMatch }) {
  const team1Rows = playersByRow(match.team1.players, match.team1.formation)
  // Team 2 attacks upward, so its goalkeeper sits at the bottom edge.
  const team2Rows = playersByRow(match.team2.players, match.team2.formation).reverse()

  return (
    <PitchField>
      <div className="absolute left-1 top-1 z-10">
        <TeamBadge label={es.team1} color={TEAM1_SHIRT} won={match.winner === 'team1'} />
      </div>
      <div className="absolute bottom-1 left-1 z-10">
        <TeamBadge label={es.team2} color={TEAM2_SHIRT} won={match.winner === 'team2'} />
      </div>

      <div className="flex flex-1 flex-col justify-around py-2">
        {team1Rows.map((row, i) => (
          <TeamRow key={`t1-${i}`} players={row} shirtClass={TEAM1_SHIRT} figura={match.figura} />
        ))}
      </div>
      <div className="flex flex-1 flex-col justify-around py-2">
        {team2Rows.map((row, i) => (
          <TeamRow key={`t2-${i}`} players={row} shirtClass={TEAM2_SHIRT} figura={match.figura} />
        ))}
      </div>
    </PitchField>
  )
}
