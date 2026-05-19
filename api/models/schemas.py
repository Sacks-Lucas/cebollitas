from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


EventType = Literal["regular", "extended", "monthly_event", "trip", "sports_bonus"]


class User(BaseModel):
    id: str
    name: str
    email: str


class AuthGoogleRequest(BaseModel):
    token: str


class AuthResponse(BaseModel):
    token: str
    user: User


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=1000)
    date: date
    eventType: EventType
    isExtension: bool = False
    attendeeIds: list[str] = Field(default_factory=list)
    organizerId: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class Event(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    creatorId: str
    createdAt: datetime
    updatedAt: datetime
    voteAverage: float | None = None


class UserRef(BaseModel):
    id: str
    name: str


class EventDetail(BaseModel):
    id: str
    title: str
    description: str
    date: date
    eventType: EventType
    isExtension: bool
    voteAverage: float | None = None
    organizer: UserRef | None = None
    attendees: list[UserRef] = Field(default_factory=list)


class VoteCreate(BaseModel):
    eventId: str
    fun: int = Field(ge=1, le=10)
    cost: int = Field(ge=1, le=10)
    originality: int = Field(ge=1, le=10)


class VoteRecord(BaseModel):
    id: str
    eventId: str
    voterIdHash: str
    encryptedPayload: str


class VoteAverage(BaseModel):
    averageScore: float


class RankingRow(BaseModel):
    userId: str
    name: str
    totalPoints: int
    attendancePercentage: int
    absences: int


class MonthlyEventCard(BaseModel):
    month: int
    organizerName: str
    event: Event | None


class HasVotedResponse(BaseModel):
    hasVoted: bool
