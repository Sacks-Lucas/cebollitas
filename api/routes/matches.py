from fastapi import APIRouter, Depends

from models.schemas import Match
from services import matches_service
from services.roles_service import ROLE_FUTBOL, require_roles

router = APIRouter(prefix="/api", tags=["matches"])


@router.get("/matches", response_model=list[Match])
def list_matches(_: dict = Depends(require_roles(ROLE_FUTBOL))) -> list[Match]:
    return [Match.model_validate(match) for match in matches_service.list_matches()]
