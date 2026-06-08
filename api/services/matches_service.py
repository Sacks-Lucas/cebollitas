"""Football matches read service.

Matches are loaded from the source Excel into the `matches` collection by
`scripts/load_matches_excel.py`. Each match stores a `userId` linking to
allowed_users; this service resolves the current display name and owns the
ordering so routes stay thin.
"""

from datetime import datetime, timezone

from repositories.data_store import get_allowed_users, get_matches
from services.roles_service import ROLE_FUTBOL

_AXEL_ID = "13e75b34-e46a-57c2-aaad-0ccd39b8e488"

# Manual world cup adjustments by calendar year → {userId: bonus}. Applied only
# for the current year, so they don't carry over to future seasons.
WORLD_CUP_BONUSES: dict[int, dict[str, int]] = {
    2026: {_AXEL_ID: 1},
}

# Players who always rank below others when tied on world cups.
WORLD_CUP_TIE_LOSERS = {_AXEL_ID}


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


def _count_world_cups(results: list[str]) -> int:
    """Count completed "world cups" over a chronological list of results.

    A world cup is a run of 7 matches: a 3-match group stage that totals >= 4
    points (win=3, draw=1, loss=0) followed by 4 straight wins (octavos, cuartos,
    semis, final). The run resets — and the next one starts at the following
    match — when any of these happen:
      - the cup is won (7th match is a win),
      - a 2nd loss occurs within the group stage,
      - the group stage ends under 4 points,
      - any non-win occurs in the knockout phase (matches 4-7).
    """
    won = 0
    attempt: list[str] = []
    for result in results:
        attempt.append(result)
        position = len(attempt)
        if position <= 3:  # group stage
            if attempt.count("loss") >= 2:
                attempt = []
            elif position == 3:
                points = 3 * attempt.count("win") + attempt.count("draw")
                if points < 4:
                    attempt = []
        else:  # knockout (matches 4-7)
            if result != "win":
                attempt = []
            elif position == 7:
                won += 1
                attempt = []
    return won


def list_world_cups() -> list[dict]:
    """Per-FUTBOL-user world cup count, sorted by count desc then name."""
    players = [user for user in get_allowed_users() if ROLE_FUTBOL in user.get("roles", [])]

    matches_by_user: dict[str, list[dict]] = {}
    for match in get_matches():
        matches_by_user.setdefault(match.get("userId"), []).append(match)

    bonuses = WORLD_CUP_BONUSES.get(datetime.now(timezone.utc).year, {})

    result = []
    for player in players:
        ordered = sorted(matches_by_user.get(player["id"], []), key=lambda match: match.get("date", ""))
        results = [match.get("result") for match in ordered]
        total = _count_world_cups(results) + bonuses.get(player["id"], 0)
        result.append(
            {
                "userId": player["id"],
                "playerName": player["name"],
                "worldCups": total,
            }
        )

    # Tie-loser players sort after everyone else at the same count.
    result.sort(
        key=lambda item: (
            -item["worldCups"],
            1 if item["userId"] in WORLD_CUP_TIE_LOSERS else 0,
            item["playerName"].lower(),
        )
    )
    return result
