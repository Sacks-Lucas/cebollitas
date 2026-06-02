import math
from collections import defaultdict


ATTENDEE_POINTS = 30
ORGANIZER_POINTS = 40
EXTENDED_POINTS = 15
MONTHLY_ATTENDEE_POINTS = 40
TRIP_POINTS = 70


def compute_rankings(
    users: list[dict],
    events: list[dict],
    trips: list[dict] | None = None,
    vote_averages: dict[str, float] | None = None,
) -> list[dict]:
    trips = trips or []
    vote_averages = vote_averages or {}
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
