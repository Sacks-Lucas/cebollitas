import io
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from dependencies import get_admin_user, get_current_user
from models.schemas import Event, EventCreate
from repositories.data_store import events_repo, get_allowed_users, monthly_assignments_repo
from routes.monthly_events import assert_monthly_payload_complete
from services.admin_service import is_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@router.get("/me")
def admin_me(current_user: dict = Depends(get_current_user)) -> dict:
    return {"isAdmin": is_admin(current_user), "email": current_user["email"]}


@router.get("/backup")
def backup(_: dict = Depends(get_admin_user)) -> StreamingResponse:
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in DATA_DIR.glob("*.json"):
            zip_file.write(file_path, arcname=file_path.name)

    memory_file.seek(0)
    return StreamingResponse(
        memory_file,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=cebollitas-backup.zip"},
    )


@router.post("/monthly-events/{month}/event", response_model=Event, status_code=status.HTTP_201_CREATED)
def admin_create_monthly_event(
    month: int,
    payload: EventCreate,
    current_user: dict = Depends(get_admin_user),
) -> Event:
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
