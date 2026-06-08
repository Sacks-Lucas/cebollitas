export type RoleCode = 'ADMIN' | 'CEBOLLITAS' | 'FUTBOL'

export type Role = {
  id: RoleCode
  name: string
  description: string | null
}

export type User = {
  id: string
  name: string
  email: string
  roles: RoleCode[]
}

export type EventType = 'regular' | 'extended' | 'monthly_event' | 'trip' | 'sports_bonus'

export type MatchResult = 'win' | 'loss' | 'draw'

export type Match = {
  id: string
  userId: string
  playerName: string
  date: string
  result: MatchResult
  goals: number | null
  stadium: string | null
}

export type MatchCreatePayload = {
  result: MatchResult
  goals: number
  stadium: string | null
  date: string
  userId?: string | null
}

export type MatchUpdatePayload = {
  goals: number
  stadium: string | null
  date: string
}

export type PlayerStats = {
  userId: string
  playerName: string
  played: number
  won: number
  drawn: number
  lost: number
  goals: number
  winRate: number
}

export type PlayerWorldCups = {
  userId: string
  playerName: string
  worldCups: number
}

export type Event = {
  id: string
  title: string
  description: string
  date: string
  eventType: EventType
  location: string | null
  amount: number | null
  imageUrl: string | null
  imagePosition: string | null
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

export type Trip = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  destination: string
  attendeeIds: string[]
  createdAt: string
  updatedAt: string
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
  imagePosition: string | null
  voteAverage: number | null
  generalAverage: number | null
  voteCount: number
  organizer: UserRef | null
  attendees: UserRef[]
}
