from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from models.schemas import Match, MatchCreate, MatchUpdate, PlayerStats, PlayerWorldCups
from repositories.data_store import get_allowed_users, matches_repo
from services import matches_service
from services.admin_service import is_admin
from services.roles_service import ROLE_FUTBOL, require_roles

router = APIRouter(prefix="/api", tags=["matches"])


def _resolve_target_user_id(current_user: dict, requested_user_id: str | None) -> str:
    """Decide which user a match belongs to.

    Non-admins can only create matches for themselves, so any requested userId is
    ignored and the JWT identity wins. Admins may target a FUTBOL user; None
    means the admin is creating it for themselves.
    """
    if not is_admin(current_user):
        return current_user["id"]
    if not requested_user_id:
        return current_user["id"]
    target = next((u for u in get_allowed_users() if u["id"] == requested_user_id), None)
    if target is None or ROLE_FUTBOL not in target.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El jugador seleccionado no es un usuario de fútbol válido.",
        )
    return requested_user_id


def _assert_can_manage(current_user: dict, match: dict, action: str) -> None:
    if not is_admin(current_user) and match["userId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Solo podés {action} tus partidos.",
        )


@router.get("/matches", response_model=list[Match])
def list_matches(_: dict = Depends(require_roles(ROLE_FUTBOL))) -> list[Match]:
    return [Match.model_validate(match) for match in matches_service.list_matches()]


@router.get("/matches/stats", response_model=list[PlayerStats])
def list_player_stats(_: dict = Depends(require_roles(ROLE_FUTBOL))) -> list[PlayerStats]:
    return [PlayerStats.model_validate(stats) for stats in matches_service.list_player_stats()]


@router.get("/matches/world-cups", response_model=list[PlayerWorldCups])
def list_world_cups(_: dict = Depends(require_roles(ROLE_FUTBOL))) -> list[PlayerWorldCups]:
    return [PlayerWorldCups.model_validate(item) for item in matches_service.list_world_cups()]


@router.post("/matches", response_model=Match, status_code=status.HTTP_201_CREATED)
def create_match(payload: MatchCreate, current_user: dict = Depends(require_roles(ROLE_FUTBOL))) -> Match:
    match = {
        "id": str(uuid4()),
        "userId": _resolve_target_user_id(current_user, payload.userId),
        "date": payload.date.isoformat(),
        "result": payload.result,
        "goals": payload.goals,
        "stadium": payload.stadium,
    }
    matches = matches_repo.read()
    matches.append(match)
    matches_repo.write(matches)
    return Match.model_validate(matches_service.with_player_name(match))


@router.put("/matches/{match_id}", response_model=Match)
def update_match(
    match_id: str,
    payload: MatchUpdate,
    current_user: dict = Depends(require_roles(ROLE_FUTBOL)),
) -> Match:
    matches = matches_repo.read()
    for idx, match in enumerate(matches):
        if match["id"] != match_id:
            continue
        _assert_can_manage(current_user, match, "editar")
        # result and userId stay untouched — only goals/stadium/date are editable.
        match["goals"] = payload.goals
        match["stadium"] = payload.stadium
        match["date"] = payload.date.isoformat()
        matches[idx] = match
        matches_repo.write(matches)
        return Match.model_validate(matches_service.with_player_name(match))

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado.")


@router.delete("/matches/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: str, current_user: dict = Depends(require_roles(ROLE_FUTBOL))) -> None:
    matches = matches_repo.read()
    for idx, match in enumerate(matches):
        if match["id"] != match_id:
            continue
        _assert_can_manage(current_user, match, "eliminar")
        del matches[idx]
        matches_repo.write(matches)
        return

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado.")
