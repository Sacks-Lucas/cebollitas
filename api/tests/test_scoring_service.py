from services.scoring_service import attendee_points_for_event, compute_rankings, organizer_points_for_event


def test_attendee_points_by_event_type() -> None:
    assert attendee_points_for_event("regular") == 30
    assert attendee_points_for_event("extended") == 15
    assert attendee_points_for_event("monthly_event") == 40
    assert attendee_points_for_event("trip") == 70
    assert attendee_points_for_event("sports_bonus") == 0


def test_organizer_points_for_monthly_event_is_rounded_up() -> None:
    event = {"eventType": "monthly_event"}
    assert organizer_points_for_event(event, 7.01) == 71


def test_compute_rankings_sorts_by_total_points() -> None:
    users = [
        {"id": "u1", "name": "A", "email": "a@a.com"},
        {"id": "u2", "name": "B", "email": "b@b.com"},
    ]
    events = [
        {"id": "e1", "eventType": "regular", "attendeeIds": ["u1", "u2"], "organizerId": "u1"},
        {"id": "e2", "eventType": "monthly_event", "attendeeIds": ["u2"], "organizerId": "u2"},
    ]

    rankings = compute_rankings(users, events, {"e2": 8.0})

    assert rankings[0]["userId"] == "u2"
    assert rankings[0]["totalPoints"] == 150
    assert rankings[1]["totalPoints"] == 70
