from datetime import date, datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status

from dependencies import get_admin_user, get_current_user
from models.schemas import Trip, TripCreate, TripUpdate
from repositories.data_store import get_allowed_users, trips_repo
from services.admin_service import is_admin
from services.image_service import TRIPS_FOLDER, save_uploaded_image

router = APIRouter(prefix="/api/trips", tags=["trips"])

MIN_ATTENDEES = 4


def assert_attendees(attendee_ids: list[str]) -> None:
    """Attendees drive the ranking (one trip = 70 points each), so the list has
    to be distinct and made of real users before it is stored."""
    unique = set(attendee_ids)
    if len(unique) != len(attendee_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La lista de asistentes tiene repetidos.",
        )
    if len(unique) < MIN_ATTENDEES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Se requieren al menos {MIN_ATTENDEES} asistentes para registrar el viaje.",
        )
    known_ids = {user["id"] for user in get_allowed_users()}
    if unique - known_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hay asistentes que no están en la lista de usuarios habilitados.",
        )


def trip_covers_month(trip: dict, month: int) -> bool:
    """Whether the trip spans the given calendar month. Walks the months it
    covers so trips crossing a year boundary are matched correctly."""
    start = date.fromisoformat(trip["startDate"])
    end = date.fromisoformat(trip["endDate"])
    year, current = start.year, start.month
    while (year, current) <= (end.year, end.month):
        if current == month:
            return True
        year, current = (year + 1, 1) if current == 12 else (year, current + 1)
    return False


@router.get("", response_model=list[Trip])
def list_trips(
    month: int | None = Query(default=None, ge=1, le=12),
    attendeeId: str | None = None,
    _: dict = Depends(get_current_user),
) -> list[Trip]:
    trips = trips_repo.read()

    if month:
        trips = [trip for trip in trips if trip_covers_month(trip, month)]
    if attendeeId:
        trips = [trip for trip in trips if attendeeId in trip.get("attendeeIds", [])]

    trips.sort(key=lambda trip: (trip["startDate"], trip.get("createdAt", "")), reverse=True)

    return [Trip.model_validate(trip) for trip in trips]


@router.post("/images")
def upload_trip_image(file: UploadFile, _: dict = Depends(get_current_user)) -> dict:
    return {"url": save_uploaded_image(file, folder=TRIPS_FOLDER)}


@router.get("/{trip_id}", response_model=Trip)
def get_trip(trip_id: str, _: dict = Depends(get_current_user)) -> Trip:
    trips = trips_repo.read()
    trip = next((item for item in trips if item["id"] == trip_id), None)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viaje no encontrado.")
    return Trip.model_validate(trip)


@router.post("", response_model=Trip, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, current_user: dict = Depends(get_current_user)) -> Trip:
    assert_attendees(payload.attendeeIds)

    now = datetime.now(timezone.utc).isoformat()
    trip = payload.model_dump()
    trip.update(
        {
            "id": str(uuid4()),
            "creatorId": current_user["id"],
            "createdAt": now,
            "updatedAt": now,
            "startDate": payload.startDate.isoformat(),
            "endDate": payload.endDate.isoformat(),
        }
    )

    trips = trips_repo.read()
    trips.append(trip)
    trips_repo.write(trips)

    return Trip.model_validate(trip)


@router.put("/{trip_id}", response_model=Trip)
def update_trip(trip_id: str, payload: TripUpdate, current_user: dict = Depends(get_current_user)) -> Trip:
    assert_attendees(payload.attendeeIds)

    trips = trips_repo.read()
    for idx, trip in enumerate(trips):
        if trip["id"] != trip_id:
            continue

        # Trips seeded before the ABM existed have no creator, so they are
        # admin-only territory.
        is_creator = bool(trip.get("creatorId")) and trip["creatorId"] == current_user["id"]
        if not (is_creator or is_admin(current_user)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo podés editar tus viajes.")

        updated = payload.model_dump()
        updated["id"] = trip["id"]
        updated["creatorId"] = trip.get("creatorId")
        updated["createdAt"] = trip["createdAt"]
        updated["updatedAt"] = datetime.now(timezone.utc).isoformat()
        updated["startDate"] = payload.startDate.isoformat()
        updated["endDate"] = payload.endDate.isoformat()
        trips[idx] = updated
        trips_repo.write(trips)
        return Trip.model_validate(updated)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viaje no encontrado.")


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: str, _: dict = Depends(get_admin_user)) -> None:
    trips = trips_repo.read()
    for idx, trip in enumerate(trips):
        if trip["id"] != trip_id:
            continue
        del trips[idx]
        trips_repo.write(trips)
        return

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viaje no encontrado.")
