export type User = {
  id: string
  name: string
  email: string
}

export type EventType = 'regular' | 'extended' | 'monthly_event' | 'trip' | 'sports_bonus'

export type Event = {
  id: string
  title: string
  description: string
  date: string
  eventType: EventType
  isExtension: boolean
  attendeeIds: string[]
  organizerId: string
  creatorId: string
  createdAt: string
  updatedAt: string
}

export type RankingRow = {
  userId: string
  name: string
  totalPoints: number
  attendancePercentage: number
}

export type MonthlyEventCard = {
  month: number
  organizerName: string
  event: Event | null
}
