import math
from collections import defaultdict


ATTENDEE_POINTS = 30
ORGANIZER_POINTS = 40
EXTENDED_POINTS = 15
MONTHLY_ATTENDEE_POINTS = 40
TRIP_POINTS = 70

# Contract bonus: organizing sporting events (Cebollitas football matches) earns
# SPORTS_EVENT_BONUS points every SPORTS_EVENTS_PER_BONUS matches organized, up
# to SPORTS_BONUS_MAX_TIMES occasions (so at most 3 * 40 = 120 points).
SPORTS_EVENT_BONUS = 40
SPORTS_EVENTS_PER_BONUS = 10
SPORTS_BONUS_MAX_TIMES = 3


def sports_organizer_bonus(organized_count: int) -> int:
    """Points earned for organizing `organized_count` sporting events."""
    return min(organized_count // SPORTS_EVENTS_PER_BONUS, SPORTS_BONUS_MAX_TIMES) * SPORTS_EVENT_BONUS


def compute_rankings(
    users: list[dict],
    events: list[dict],
    trips: list[dict] | None = None,
    vote_averages: dict[str, float] | None = None,
    cebollitas_matches: list[dict] | None = None,
) -> list[dict]:
    trips = trips or []
    vote_averages = vote_averages or {}
    cebollitas_matches = cebollitas_matches or []
    totals: dict[str, int] = defaultdict(int)
    attendance: dict[str, int] = defaultdict(int)

    for event in events:
        event_type = event.get("eventType")
        organizer_id = event.get("organizerId")
        for attendee_id in event.get("attendeeIds", []):
            attendance[attendee_id] += 1

            if event_type == "extended":
                totals[attendee_id] += EXTENDED_POINTS
            elif event_type == "monthly_event":
                if attendee_id == organizer_id:
                    # Prefer the live average computed from actual votes; fall
                    # back to a stored voteAverage when no votes are provided.
                    average = vote_averages.get(event.get("id"))
                    if average is None:
                        average = event.get("voteAverage") or 0
                    totals[attendee_id] += math.ceil(average * 10)
                else:
                    totals[attendee_id] += MONTHLY_ATTENDEE_POINTS
            elif attendee_id == organizer_id:
                totals[attendee_id] += ORGANIZER_POINTS
            else:
                totals[attendee_id] += ATTENDEE_POINTS

    for trip in trips:
        for attendee_id in trip.get("attendeeIds", []):
            totals[attendee_id] += TRIP_POINTS

    organized_counts: dict[str, int] = defaultdict(int)
    for match in cebollitas_matches:
        organizer_id = match.get("organizerId")
        if organizer_id:
            organized_counts[organizer_id] += 1
    for organizer_id, count in organized_counts.items():
        totals[organizer_id] += sports_organizer_bonus(count)

    total_events = len(events)

    ranking = []
    for user in users:
        attended = attendance[user["id"]]
        attendance_pct = round((attended / total_events) * 100) if total_events > 0 else 0
        ranking.append(
            {
                "userId": user["id"],
                "name": user["name"],
                "totalPoints": totals[user["id"]],
                "attendancePercentage": attendance_pct,
                "absences": total_events - attended,
            }
        )

    ranking.sort(key=lambda row: row["totalPoints"], reverse=True)
    return ranking
