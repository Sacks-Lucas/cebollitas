from datetime import timedelta

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from models.schemas import Trip, TripCreate, today_in_argentina
from routes.trips import assert_attendees, trip_covers_month


def make_payload(**overrides) -> dict:
    today = today_in_argentina()
    payload = {
        "title": "Crucero",
        "description": "Pasó de todo",
        "destinations": ["Caribe"],
        "startDate": (today - timedelta(days=5)).isoformat(),
        "endDate": (today - timedelta(days=1)).isoformat(),
        "photos": [],
        "attendeeIds": ["u1", "u2", "u3", "u4"],
    }
    payload.update(overrides)
    return payload


# ── Date rules ───────────────────────────────────────────────────────────────


def test_trip_accepts_end_date_today() -> None:
    today = today_in_argentina()
    trip = TripCreate.model_validate(make_payload(startDate=today.isoformat(), endDate=today.isoformat()))
    assert trip.endDate == today


def test_trip_rejects_end_date_in_the_future() -> None:
    tomorrow = today_in_argentina() + timedelta(days=1)
    with pytest.raises(ValidationError, match="no puede ser posterior a hoy"):
        TripCreate.model_validate(make_payload(endDate=tomorrow.isoformat()))


def test_trip_rejects_end_date_before_start_date() -> None:
    today = today_in_argentina()
    with pytest.raises(ValidationError, match="no puede ser anterior a la fecha desde"):
        TripCreate.model_validate(
            make_payload(
                startDate=(today - timedelta(days=1)).isoformat(),
                endDate=(today - timedelta(days=10)).isoformat(),
            )
        )


# ── Photos ───────────────────────────────────────────────────────────────────


def test_trip_accepts_up_to_three_photos() -> None:
    trip = TripCreate.model_validate(make_payload(photos=["a", "b", "c"]))
    assert len(trip.photos) == 3


def test_trip_rejects_more_than_three_photos() -> None:
    with pytest.raises(ValidationError):
        TripCreate.model_validate(make_payload(photos=["a", "b", "c", "d"]))


# ── Text fields ──────────────────────────────────────────────────────────────


def test_trip_strips_surrounding_whitespace() -> None:
    trip = TripCreate.model_validate(make_payload(title="  Crucero  ", destinations=[" Caribe "]))
    assert trip.title == "Crucero"
    assert trip.destinations == ["Caribe"]


def test_trip_rejects_whitespace_only_text() -> None:
    with pytest.raises(ValidationError, match="no puede quedar vacío"):
        TripCreate.model_validate(make_payload(title="   "))


# ── Destinations ─────────────────────────────────────────────────────────────


def test_trip_accepts_several_destinations() -> None:
    trip = TripCreate.model_validate(make_payload(destinations=["Caribe", "Bahamas", "Miami"]))
    assert trip.destinations == ["Caribe", "Bahamas", "Miami"]


def test_trip_requires_at_least_one_destination() -> None:
    with pytest.raises(ValidationError):
        TripCreate.model_validate(make_payload(destinations=[]))


def test_trip_rejects_whitespace_only_destination() -> None:
    with pytest.raises(ValidationError, match="no pueden quedar vacíos"):
        TripCreate.model_validate(make_payload(destinations=["Caribe", "   "]))


def test_trip_rejects_duplicate_destinations() -> None:
    with pytest.raises(ValidationError, match="destinos tiene repetidos"):
        TripCreate.model_validate(make_payload(destinations=["Caribe", "Caribe"]))


def test_trip_reads_legacy_single_destination() -> None:
    payload = make_payload()
    payload.pop("destinations")
    payload["destination"] = "Crucero"
    trip = TripCreate.model_validate(payload)
    assert trip.destinations == ["Crucero"]


# ── Legacy records ───────────────────────────────────────────────────────────


def test_trip_reads_legacy_record_without_creator_or_photos() -> None:
    trip = Trip.model_validate(
        {
            "id": "t1",
            "title": "Vacaciones CRUCERO",
            "description": "Indescriptible",
            "destination": "Crucero",  # legacy single-destination record
            "startDate": "2026-02-12",
            "endDate": "2026-02-12",
            "attendeeIds": ["u1", "u2", "u3", "u4"],
            "createdAt": "2026-05-19T12:00:00+00:00",
            "updatedAt": "2026-05-19T12:00:00+00:00",
        }
    )
    assert trip.creatorId is None
    assert trip.photos == []
    assert trip.destinations == ["Crucero"]


# ── Month filter ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize("month", [12, 1])
def test_trip_covers_month_across_a_year_boundary(month: int) -> None:
    trip = {"startDate": "2025-12-28", "endDate": "2026-01-04"}
    assert trip_covers_month(trip, month) is True


def test_trip_does_not_cover_an_unrelated_month() -> None:
    trip = {"startDate": "2025-12-28", "endDate": "2026-01-04"}
    assert trip_covers_month(trip, 6) is False


def test_trip_covers_only_its_own_month_when_short() -> None:
    trip = {"startDate": "2026-03-02", "endDate": "2026-03-09"}
    assert trip_covers_month(trip, 3) is True
    assert trip_covers_month(trip, 4) is False


# ── Attendees ────────────────────────────────────────────────────────────────


@pytest.fixture
def known_users(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "routes.trips.get_allowed_users",
        lambda: [{"id": f"u{n}", "name": f"User {n}"} for n in range(1, 6)],
    )


def test_assert_attendees_accepts_four_distinct_known_users(known_users: None) -> None:
    assert_attendees(["u1", "u2", "u3", "u4"])


def test_assert_attendees_rejects_duplicates(known_users: None) -> None:
    with pytest.raises(HTTPException) as exc:
        assert_attendees(["u1", "u1", "u2", "u3"])
    assert exc.value.status_code == 400
    assert "repetidos" in exc.value.detail


def test_assert_attendees_rejects_fewer_than_four(known_users: None) -> None:
    with pytest.raises(HTTPException) as exc:
        assert_attendees(["u1", "u2", "u3"])
    assert exc.value.status_code == 400
    assert "al menos 4" in exc.value.detail


def test_assert_attendees_rejects_unknown_users(known_users: None) -> None:
    with pytest.raises(HTTPException) as exc:
        assert_attendees(["u1", "u2", "u3", "ghost"])
    assert exc.value.status_code == 400
    assert "usuarios habilitados" in exc.value.detail
