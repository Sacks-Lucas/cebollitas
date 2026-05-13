from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from models.schemas import Event, EventCreate, MonthlyEventCard
from repositories.data_store import events_repo, get_allowed_users, monthly_assignments_repo

router = APIRouter(prefix="/api", tags=["monthly-events"])


@router.get("/monthly-events", response_model=list[MonthlyEventCard])
def list_monthly_events(_: dict = Depends(get_current_user)) -> list[MonthlyEventCard]:
    assignments = monthly_assignments_repo.read()
    events = events_repo.read()
    cards: list[MonthlyEventCard] = []

    for month in range(1, 13):
        event = next(
            (
                Event.model_validate(item)
                for item in events
                if item["eventType"] == "monthly_event" and datetime.fromisoformat(item["date"]).month == month
            ),
            None,
        )
        cards.append(
            MonthlyEventCard(
                month=month,
                organizerName=assignments.get(str(month), "Sin asignar"),
                event=event,
            )
        )

    return cards


@router.post("/monthly-events/{month}/event", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_monthly_event(month: int, payload: EventCreate, current_user: dict = Depends(get_current_user)) -> Event:
    if not 1 <= month <= 12:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mes inválido.")

    if len(payload.attendeeIds) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 4 asistentes para registrar el evento.",
        )

    assignments = monthly_assignments_repo.read()
    assigned_name = assignments.get(str(month))
    if not assigned_name:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay organizador asignado para este mes.")

    users = get_allowed_users()
    assigned_user = next((user for user in users if user["name"] == assigned_name), None)
    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El organizador asignado no está en la lista de usuarios habilitados.",
        )

    if assigned_user["id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Este mes no te toca organizar a vos.")

    events = events_repo.read()
    exists = any(
        item["eventType"] == "monthly_event" and datetime.fromisoformat(item["date"]).month == month for item in events
    )
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese mes ya tiene evento del mes.")

    now = datetime.now(timezone.utc).isoformat()
    event = payload.model_dump()
    event.update(
        {
            "id": str(uuid4()),
            "eventType": "monthly_event",
            "organizerId": assigned_user["id"],
            "creatorId": current_user["id"],
            "createdAt": now,
            "updatedAt": now,
            "date": payload.date.isoformat(),
        }
    )
    events.append(event)
    events_repo.write(events)

    return Event.model_validate(event)
