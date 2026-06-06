"""Football matches read service.

Matches are loaded from the source Excel into the `matches` collection by
`scripts/load_matches_excel.py`. Each match stores a `userId` linking to
allowed_users; this service resolves the current display name and owns the
ordering so routes stay thin.
"""

from repositories.data_store import get_allowed_users, get_matches
from services.roles_service import ROLE_FUTBOL


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


def list_player_stats() -> list[dict]:
    """Aggregate per-player stats for every FUTBOL user, sorted by name.

    Includes players with no matches yet (played = 0). Win rate is the points
    percentage (won*3 + drawn) / (played*3) * 100, or 0 when no matches.
    """
    players = [user for user in get_allowed_users() if ROLE_FUTBOL in user.get("roles", [])]

    matches_by_user: dict[str, list[dict]] = {}
    for match in get_matches():
        matches_by_user.setdefault(match.get("userId"), []).append(match)

    stats = []
    for player in players:
        player_matches = matches_by_user.get(player["id"], [])
        played = len(player_matches)
        won = sum(1 for match in player_matches if match.get("result") == "win")
        drawn = sum(1 for match in player_matches if match.get("result") == "draw")
        lost = sum(1 for match in player_matches if match.get("result") == "loss")
        goals = sum(match.get("goals") or 0 for match in player_matches)
        win_rate = round((won * 3 + drawn) / (played * 3) * 100, 2) if played else 0.0
        stats.append(
            {
                "userId": player["id"],
                "playerName": player["name"],
                "played": played,
                "won": won,
                "drawn": drawn,
                "lost": lost,
                "goals": goals,
                "winRate": win_rate,
            }
        )

    stats.sort(key=lambda item: item["playerName"].lower())
    return stats
