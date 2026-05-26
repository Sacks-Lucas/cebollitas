from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from dependencies import get_current_user
from models.schemas import Event, EventCreate, EventUpdate, MonthlyEventCard
from repositories.data_store import events_repo, get_allowed_users, monthly_assignments_repo
from services.admin_service import is_admin
from services.image_service import save_uploaded_image

router = APIRouter(prefix="/api", tags=["monthly-events"])


def resolve_assigned_organizer(month: int) -> dict | None:
    assignments = monthly_assignments_repo.read()
    assigned_name = assignments.get(str(month))
    if not assigned_name:
        return None
    users = get_allowed_users()
    return next((user for user in users if user["name"] == assigned_name), None)


def assert_monthly_payload_complete(payload: EventCreate) -> None:
    missing: list[str] = []
    if not (payload.location and payload.location.strip()):
        missing.append("ubicación")
    if payload.amount is None:
        missing.append("monto")
    if not (payload.imageUrl and payload.imageUrl.strip()):
        missing.append("imagen")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campos obligatorios faltantes: {', '.join(missing)}.",
        )


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


@router.post("/monthly-events/images")
def upload_monthly_event_image(file: UploadFile, _: dict = Depends(get_current_user)) -> dict:
    return {"url": save_uploaded_image(file)}


@router.post("/monthly-events/{month}/event", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_monthly_event(month: int, payload: EventCreate, current_user: dict = Depends(get_current_user)) -> Event:
    if not 1 <= month <= 12:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mes inválido.")

    if len(payload.attendeeIds) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 4 asistentes para registrar el evento.",
        )

    assert_monthly_payload_complete(payload)

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


@router.put("/monthly-events/{event_id}", response_model=Event)
def update_monthly_event(event_id: str, payload: EventUpdate, current_user: dict = Depends(get_current_user)) -> Event:
    if len(payload.attendeeIds) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 4 asistentes para registrar el evento.",
        )

    assert_monthly_payload_complete(payload)

    events = events_repo.read()
    for idx, event in enumerate(events):
        if event["id"] != event_id:
            continue
        if event["eventType"] != "monthly_event":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No es un evento del mes.")

        month = datetime.fromisoformat(event["date"]).month
        assigned_user = resolve_assigned_organizer(month)

        is_creator = event["creatorId"] == current_user["id"]
        is_assigned = assigned_user is not None and assigned_user["id"] == current_user["id"]
        if not (is_creator or is_assigned or is_admin(current_user)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenés permisos para editar este evento.")

        updated = payload.model_dump()
        updated["id"] = event["id"]
        updated["eventType"] = "monthly_event"
        updated["organizerId"] = assigned_user["id"] if assigned_user else event.get("organizerId")
        updated["creatorId"] = event["creatorId"]
        updated["createdAt"] = event["createdAt"]
        updated["updatedAt"] = datetime.now(timezone.utc).isoformat()
        updated["date"] = payload.date.isoformat()
        events[idx] = updated
        events_repo.write(events)
        return Event.model_validate(updated)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")
