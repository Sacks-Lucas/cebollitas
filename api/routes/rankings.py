from fastapi import APIRouter, Depends

from dependencies import get_current_user
from models.schemas import RankingRow
from repositories.data_store import events_repo, get_allowed_users, get_cebollitas_matches, trips_repo
from services.scoring_service import compute_rankings
from services.vote_service import get_vote_averages_by_event

router = APIRouter(prefix="/api", tags=["rankings"])


@router.get("/rankings", response_model=list[RankingRow])
def rankings(_: dict = Depends(get_current_user)) -> list[RankingRow]:
    users = get_allowed_users()
    events = events_repo.read()
    trips = trips_repo.read()
    rows = compute_rankings(
        users,
        events,
        trips,
        vote_averages=get_vote_averages_by_event(),
        cebollitas_matches=get_cebollitas_matches(),
    )
    return [RankingRow.model_validate(row) for row in rows]
