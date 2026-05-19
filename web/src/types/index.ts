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
  location: string | null
  amount: number | null
  imageUrl: string | null
  attendeeIds: string[]
  organizerId: string | null
  creatorId: string
  createdAt: string
  updatedAt: string
}

export type RankingRow = {
  userId: string
  name: string
  totalPoints: number
  attendancePercentage: number
  absences: number
}

export type MonthlyEventCard = {
  month: number
  organizerName: string
  event: Event | null
}

export type UserRef = {
  id: string
  name: string
}

export type MyVote = {
  fun: number
  cost: number
  originality: number
}

export type EventDetail = {
  id: string
  title: string
  description: string
  date: string
  eventType: EventType
  location: string | null
  amount: number | null
  imageUrl: string | null
  voteAverage: number | null
  organizer: UserRef | null
  attendees: UserRef[]
}
