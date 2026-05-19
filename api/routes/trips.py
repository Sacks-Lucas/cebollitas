from datetime import datetime

from fastapi import APIRouter, Depends, Query

from dependencies import get_current_user
from models.schemas import Trip
from repositories.data_store import trips_repo

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.get("", response_model=list[Trip])
def list_trips(
    month: int | None = Query(default=None, ge=1, le=12),
    attendeeId: str | None = None,
    _: dict = Depends(get_current_user),
) -> list[Trip]:
    trips = trips_repo.read()

    if month:
        trips = [
            trip
            for trip in trips
            if datetime.fromisoformat(trip["startDate"]).month <= month <= datetime.fromisoformat(trip["endDate"]).month
        ]
    if attendeeId:
        trips = [trip for trip in trips if attendeeId in trip.get("attendeeIds", [])]

    trips.sort(key=lambda trip: (trip["startDate"], trip.get("createdAt", "")), reverse=True)

    return [Trip.model_validate(trip) for trip in trips]
