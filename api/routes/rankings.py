from fastapi import APIRouter, Depends

from dependencies import get_current_user
from models.schemas import RankingRow
from repositories.data_store import events_repo, get_allowed_users, trips_repo
from services.scoring_service import compute_rankings

router = APIRouter(prefix="/api", tags=["rankings"])


@router.get("/rankings", response_model=list[RankingRow])
def rankings(_: dict = Depends(get_current_user)) -> list[RankingRow]:
    users = get_allowed_users()
    events = events_repo.read()
    trips = trips_repo.read()
    rows = compute_rankings(users, events, trips)
    return [RankingRow.model_validate(row) for row in rows]
