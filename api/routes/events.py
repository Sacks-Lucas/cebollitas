from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_admin_user, get_current_user
from models.schemas import Event, EventCreate, EventDetail, EventUpdate, UserRef
from repositories.data_store import events_repo, get_allowed_users, votes_repo
from services.vote_service import count_event_votes, get_event_general_average

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=list[Event])
def list_events(
    month: int | None = Query(default=None, ge=1, le=12),
    type: str | None = None,
    attendeeId: str | None = None,
    _: dict = Depends(get_current_user),
) -> list[Event]:
    events = events_repo.read()

    if month:
        events = [event for event in events if datetime.fromisoformat(event["date"]).month == month]
    if type:
        events = [event for event in events if event["eventType"] == type]
    if attendeeId:
        events = [event for event in events if attendeeId in event.get("attendeeIds", [])]

    events.sort(key=lambda event: (event["date"], event.get("createdAt", "")), reverse=True)

    return [Event.model_validate(event) for event in events]


@router.post("", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, current_user: dict = Depends(get_current_user)) -> Event:
    if len(payload.attendeeIds) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 4 asistentes para registrar el evento.",
        )

    now = datetime.now(timezone.utc).isoformat()
    event = payload.model_dump()
    event.update(
        {
            "id": str(uuid4()),
            "creatorId": current_user["id"],
            "createdAt": now,
            "updatedAt": now,
            "date": payload.date.isoformat(),
        }
    )

    events = events_repo.read()
    events.append(event)
    events_repo.write(events)

    return Event.model_validate(event)


@router.get("/{event_id}", response_model=Event)
def get_event(event_id: str, _: dict = Depends(get_current_user)) -> Event:
    events = events_repo.read()
    event = next((item for item in events if item["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")
    return Event.model_validate(event)


@router.get("/{event_id}/detail", response_model=EventDetail)
def get_event_detail(event_id: str, _: dict = Depends(get_current_user)) -> EventDetail:
    events = events_repo.read()
    event = next((item for item in events if item["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    users_by_id = {u["id"]: u for u in get_allowed_users()}
    attendees = [
        UserRef(id=u["id"], name=u["name"])
        for attendee_id in event.get("attendeeIds", [])
        if (u := users_by_id.get(attendee_id)) is not None
    ]
    organizer_user = users_by_id.get(event.get("organizerId") or "")
    organizer = UserRef(id=organizer_user["id"], name=organizer_user["name"]) if organizer_user else None

    return EventDetail(
        id=event["id"],
        title=event["title"],
        description=event["description"],
        date=event["date"],
        eventType=event["eventType"],
        location=event.get("location"),
        amount=event.get("amount"),
        imageUrl=event.get("imageUrl"),
        imagePosition=event.get("imagePosition"),
        voteAverage=event.get("voteAverage"),
        generalAverage=get_event_general_average(event_id),
        voteCount=count_event_votes(event_id),
        organizer=organizer,
        attendees=attendees,
    )


@router.put("/{event_id}", response_model=Event)
def update_event(event_id: str, payload: EventUpdate, current_user: dict = Depends(get_current_user)) -> Event:
    if len(payload.attendeeIds) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 4 asistentes para registrar el evento.",
        )

    events = events_repo.read()
    for idx, event in enumerate(events):
        if event["id"] != event_id:
            continue
        if event["creatorId"] != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo podés editar tus eventos.")

        updated = payload.model_dump()
        updated["id"] = event["id"]
        updated["creatorId"] = event["creatorId"]
        updated["createdAt"] = event["createdAt"]
        updated["updatedAt"] = datetime.now(timezone.utc).isoformat()
        updated["date"] = payload.date.isoformat()
        events[idx] = updated
        events_repo.write(events)
        return Event.model_validate(updated)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: str, _: dict = Depends(get_admin_user)) -> None:
    events = events_repo.read()
    for idx, event in enumerate(events):
        if event["id"] != event_id:
            continue
        del events[idx]
        events_repo.write(events)

        # Drop any votes that referenced the deleted event so votes.json
        # doesn't accumulate orphans.
        votes = votes_repo.read()
        remaining = [vote for vote in votes if vote.get("eventId") != event_id]
        if len(remaining) != len(votes):
            votes_repo.write(remaining)
        return

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")
