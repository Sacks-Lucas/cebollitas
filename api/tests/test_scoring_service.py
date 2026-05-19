from services.scoring_service import compute_rankings


def test_compute_rankings_awards_30_for_attendance_and_40_for_organizer() -> None:
    users = [
        {"id": "u1", "name": "A", "email": "a@a.com"},
        {"id": "u2", "name": "B", "email": "b@b.com"},
        {"id": "u3", "name": "C", "email": "c@c.com"},
    ]
    events = [
        {"id": "e1", "eventType": "regular", "attendeeIds": ["u1", "u2"], "organizerId": "u1"},
        {"id": "e2", "eventType": "regular", "attendeeIds": ["u2", "u3"], "organizerId": "u2"},
    ]

    rankings = compute_rankings(users, events)

    by_user = {row["userId"]: row for row in rankings}
    assert by_user["u1"]["totalPoints"] == 40
    assert by_user["u2"]["totalPoints"] == 30 + 40
    assert by_user["u3"]["totalPoints"] == 30


def test_compute_rankings_monthly_event_uses_vote_average_for_organizer() -> None:
    users = [
        {"id": "u1", "name": "A", "email": "a@a.com"},
        {"id": "u2", "name": "B", "email": "b@b.com"},
        {"id": "u3", "name": "C", "email": "c@c.com"},
    ]
    events = [
        {
            "id": "e1",
            "eventType": "monthly_event",
            "voteAverage": 7.0,
            "attendeeIds": ["u1", "u2", "u3"],
            "organizerId": "u1",
        },
    ]

    rankings = compute_rankings(users, events)

    by_user = {row["userId"]: row for row in rankings}
    assert by_user["u1"]["totalPoints"] == 70
    assert by_user["u2"]["totalPoints"] == 40
    assert by_user["u3"]["totalPoints"] == 40


def test_compute_rankings_monthly_event_ceils_organizer_average() -> None:
    users = [{"id": "u1", "name": "A", "email": "a@a.com"}]
    events = [
        {
            "id": "e1",
            "eventType": "monthly_event",
            "voteAverage": 7.01,
            "attendeeIds": ["u1"],
            "organizerId": "u1",
        },
    ]

    assert compute_rankings(users, events)[0]["totalPoints"] == 71


def test_compute_rankings_monthly_event_without_vote_average_gives_organizer_zero() -> None:
    users = [{"id": "u1", "name": "A", "email": "a@a.com"}]
    events = [
        {
            "id": "e1",
            "eventType": "monthly_event",
            "attendeeIds": ["u1"],
            "organizerId": "u1",
        },
    ]

    assert compute_rankings(users, events)[0]["totalPoints"] == 0


def test_compute_rankings_extended_events_award_15_with_no_organizer_bonus() -> None:
    users = [
        {"id": "u1", "name": "A", "email": "a@a.com"},
        {"id": "u2", "name": "B", "email": "b@b.com"},
    ]
    events = [
        {"id": "e1", "eventType": "extended", "attendeeIds": ["u1", "u2"], "organizerId": "u1"},
    ]

    rankings = compute_rankings(users, events)

    by_user = {row["userId"]: row for row in rankings}
    assert by_user["u1"]["totalPoints"] == 15
    assert by_user["u2"]["totalPoints"] == 15


def test_compute_rankings_sorts_by_total_points_desc() -> None:
    users = [
        {"id": "u1", "name": "A", "email": "a@a.com"},
        {"id": "u2", "name": "B", "email": "b@b.com"},
    ]
    events = [
        {"id": "e1", "attendeeIds": ["u1", "u2"], "organizerId": "u1"},
        {"id": "e2", "attendeeIds": ["u1"], "organizerId": "u1"},
    ]

    rankings = compute_rankings(users, events)

    assert rankings[0]["userId"] == "u1"
    assert rankings[0]["totalPoints"] == 80
    assert rankings[1]["userId"] == "u2"
    assert rankings[1]["totalPoints"] == 30


def test_compute_rankings_attendance_percentage_and_absences() -> None:
    users = [{"id": "u1", "name": "A", "email": "a@a.com"}]
    events = [
        {"id": "e1", "attendeeIds": ["u1"], "organizerId": None},
        {"id": "e2", "attendeeIds": [], "organizerId": None},
        {"id": "e3", "attendeeIds": ["u1"], "organizerId": None},
        {"id": "e4", "attendeeIds": [], "organizerId": None},
    ]

    rankings = compute_rankings(users, events)

    assert rankings[0]["attendancePercentage"] == 50
    assert rankings[0]["absences"] == 2
