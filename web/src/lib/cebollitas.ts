import type { Cancha } from '../types'

// Mirror of the backend CANCHA_FORMATIONS. The numbers are the outfield lines;
// the goalkeeper is always 1 at the back, so 1 + sum(parts) === cancha.
export const CANCHA_FORMATIONS: Record<Cancha, string[]> = {
  5: ['2-2', '1-2-1', '3-1', '1-3'],
  6: ['2-1-2', '2-2-1', '1-2-2', '3-2'],
  7: ['2-3-1', '3-2-1', '2-2-2', '3-3'],
  8: ['3-3-1', '3-2-2', '2-3-2', '4-3'],
  11: ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-5-1'],
}

export const CANCHA_OPTIONS: Cancha[] = [5, 6, 7, 8, 11]

// Rows from the back (goalkeeper) to the front: [1, ...outfield lines].
export function formationRows(formation: string): number[] {
  return [1, ...formation.split('-').map((n) => Number(n))]
}

// Split an ordered player list into rows according to the formation.
export function playersByRow(players: string[], formation: string): string[][] {
  const rows = formationRows(formation)
  const out: string[][] = []
  let i = 0
  for (const count of rows) {
    out.push(players.slice(i, i + count))
    i += count
  }
  return out
}

// Rows of flat player indices for a formation (back/GK row first).
export function formationSlots(formation: string): number[][] {
  const rows = formationRows(formation)
  const out: number[][] = []
  let i = 0
  for (const count of rows) {
    const row: number[] = []
    for (let k = 0; k < count; k++) row.push(i++)
    out.push(row)
  }
  return out
}

// Best-effort: a player is the figura if the figura text starts with their name.
export function isFigura(playerName: string, figura: string | null): boolean {
  if (!figura) return false
  const name = playerName.trim().toLowerCase()
  return name.length > 0 && figura.trim().toLowerCase().startsWith(name)
}
