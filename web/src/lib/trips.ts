import { es } from '../i18n/es'
import type { Trip } from '../types'

/** Renders the trip duration, collapsing single-day trips to one date. */
export function formatTripDateRange(trip: Pick<Trip, 'startDate' | 'endDate'>): string {
  const start = trip.startDate.slice(0, 10)
  const end = trip.endDate.slice(0, 10)
  if (start === end) {
    return start
  }
  return es.tripDateRange.replace('{start}', start).replace('{end}', end)
}
