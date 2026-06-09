from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from models.schemas import CebollitasMatch, CebollitasMatchCreate, CebollitasMatchUpdate
from repositories.data_store import cebollitas_matches_repo
from services import cebollitas_service
from services.admin_service import is_admin
from services.roles_service import ROLE_CEBOLLITAS, ROLE_FUTBOL, require_all_roles

router = APIRouter(prefix="/api/cebollitas-matches", tags=["cebollitas-matches"])

_require_access = require_all_roles(ROLE_FUTBOL, ROLE_CEBOLLITAS)


def _assert_organizer_is_futbol(organizer_id: str) -> None:
    if not cebollitas_service.is_futbol_user(organizer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El organizador debe ser un usuario de fútbol.",
        )


def _assert_can_manage(current_user: dict, match: dict) -> None:
    if not is_admin(current_user) and match.get("creatorId") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo podés editar o eliminar los partidos que creaste.",
        )


@router.get("", response_model=list[CebollitasMatch])
def list_matches(_: dict = Depends(_require_access)) -> list[CebollitasMatch]:
    return [CebollitasMatch.model_validate(match) for match in cebollitas_service.list_matches()]


@router.post("", response_model=CebollitasMatch, status_code=status.HTTP_201_CREATED)
def create_match(payload: CebollitasMatchCreate, current_user: dict = Depends(_require_access)) -> CebollitasMatch:
    _assert_organizer_is_futbol(payload.organizerId)
    now = datetime.now(timezone.utc).isoformat()
    match = {
        "id": str(uuid4()),
        "date": payload.date.isoformat(),
        "cancha": payload.cancha,
        "team1": payload.team1.model_dump(),
        "team2": payload.team2.model_dump(),
        "winner": payload.winner,
        "figura": payload.figura,
        "organizerId": payload.organizerId,
        "creatorId": current_user["id"],
        "createdAt": now,
        "updatedAt": now,
    }
    matches = cebollitas_matches_repo.read()
    matches.append(match)
    cebollitas_matches_repo.write(matches)
    return CebollitasMatch.model_validate(cebollitas_service.with_organizer_name(match))


@router.put("/{match_id}", response_model=CebollitasMatch)
def update_match(
    match_id: str,
    payload: CebollitasMatchUpdate,
    current_user: dict = Depends(_require_access),
) -> CebollitasMatch:
    _assert_organizer_is_futbol(payload.organizerId)
    matches = cebollitas_matches_repo.read()
    for idx, match in enumerate(matches):
        if match["id"] != match_id:
            continue
        _assert_can_manage(current_user, match)
        match.update(
            {
                "date": payload.date.isoformat(),
                "cancha": payload.cancha,
                "team1": payload.team1.model_dump(),
                "team2": payload.team2.model_dump(),
                "winner": payload.winner,
                "figura": payload.figura,
                "organizerId": payload.organizerId,
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
        matches[idx] = match
        cebollitas_matches_repo.write(matches)
        return CebollitasMatch.model_validate(cebollitas_service.with_organizer_name(match))

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado.")


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: str, current_user: dict = Depends(_require_access)) -> None:
    matches = cebollitas_matches_repo.read()
    for idx, match in enumerate(matches):
        if match["id"] != match_id:
            continue
        _assert_can_manage(current_user, match)
        del matches[idx]
        cebollitas_matches_repo.write(matches)
        return

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado.")
