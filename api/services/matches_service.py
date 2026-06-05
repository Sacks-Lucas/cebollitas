"""Football matches read service.

Matches are loaded from the source Excel into the `matches` collection by
`scripts/load_matches_excel.py`. Each match stores a `userId` linking to
allowed_users; this service resolves the current display name and owns the
ordering so routes stay thin.
"""

from repositories.data_store import get_allowed_users, get_matches


def with_player_name(match: dict) -> dict:
    """Attach the player's current display name (resolved from allowed_users)."""
    name_by_id = {user["id"]: user["name"] for user in get_allowed_users()}
    return {**match, "playerName": name_by_id.get(match.get("userId"), "")}


def list_matches() -> list[dict]:
    """Return all matches, most recent first, with the player's resolved name.

    `playerName` is derived from allowed_users by `userId` so renames propagate
    without touching the matches collection. Unknown ids fall back to "".
    """
    name_by_id = {user["id"]: user["name"] for user in get_allowed_users()}
    matches = sorted(get_matches(), key=lambda match: match.get("date", ""), reverse=True)
    return [{**match, "playerName": name_by_id.get(match.get("userId"), "")} for match in matches]
