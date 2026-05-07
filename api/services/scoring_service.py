import math
from collections import defaultdict


def attendee_points_for_event(event_type: str) -> int:
    if event_type == "regular":
        return 30
    if event_type == "extended":
        return 15
    if event_type == "monthly_event":
        return 40
    if event_type == "trip":
        return 70
    return 0


def organizer_points_for_event(event: dict, vote_average: float | None = None) -> int:
    event_type = event["eventType"]
    if event_type == "regular":
        return 40
    if event_type == "extended":
        return 0
    if event_type == "monthly_event":
        return math.ceil((vote_average or 0) * 10)
    if event_type == "trip":
        return 0
    return 0


def compute_rankings(users: list[dict], events: list[dict], vote_averages: dict[str, float]) -> list[dict]:
    totals = defaultdict(int)
    attendance = defaultdict(int)

    total_events = len(events)
    for event in events:
        attendee_points = attendee_points_for_event(event["eventType"])
        for attendee_id in event.get("attendeeIds", []):
            totals[attendee_id] += attendee_points
            attendance[attendee_id] += 1

        organizer_id = event.get("organizerId")
        if organizer_id:
            totals[organizer_id] += organizer_points_for_event(event, vote_averages.get(event["id"]))

    ranking = []
    for user in users:
        attended = attendance[user["id"]]
        attendance_pct = 0
        if total_events > 0:
            attendance_pct = round((attended / total_events) * 100)

        ranking.append(
            {
                "userId": user["id"],
                "name": user["name"],
                "totalPoints": totals[user["id"]],
                "attendancePercentage": attendance_pct,
            }
        )

    ranking.sort(key=lambda row: row["totalPoints"], reverse=True)
    return ranking
