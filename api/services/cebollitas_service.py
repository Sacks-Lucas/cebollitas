"""Cebollitas matches (team matches) service.

A separate collection from `matches`: each record is a team game (two teams,
a winner, a figura and an organizer). The only link to the rest of the app is
`organizerId`, which must be a FUTBOL allowed_user. Team players and figura are
free text.
"""

from repositories.data_store import get_allowed_users, get_cebollitas_matches
from services.roles_service import ROLE_FUTBOL


def futbol_users() -> list[dict]:
    return [user for user in get_allowed_users() if ROLE_FUTBOL in user.get("roles", [])]


def is_futbol_user(user_id: str) -> bool:
    return any(user["id"] == user_id for user in futbol_users())


def with_organizer_name(match: dict) -> dict:
    """Attach the organizer's current display name (resolved from allowed_users)."""
    name_by_id = {user["id"]: user["name"] for user in get_allowed_users()}
    return {**match, "organizerName": name_by_id.get(match.get("organizerId"), "")}


def list_matches() -> list[dict]:
    """All cebollitas matches, most recent first, with the organizer name resolved."""
    name_by_id = {user["id"]: user["name"] for user in get_allowed_users()}
    matches = sorted(get_cebollitas_matches(), key=lambda m: m.get("date", ""), reverse=True)
    return [{**m, "organizerName": name_by_id.get(m.get("organizerId"), "")} for m in matches]
