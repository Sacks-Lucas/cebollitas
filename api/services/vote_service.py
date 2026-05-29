import hashlib
import json
import logging
import os
from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet, InvalidToken

from repositories.data_store import votes_repo


VOTING_WINDOW_DAYS = 30
logger = logging.getLogger(__name__)


def is_voting_open(event: dict) -> bool:
    created_at = datetime.fromisoformat(event["createdAt"])
    return datetime.now(timezone.utc) - created_at <= timedelta(days=VOTING_WINDOW_DAYS)


def get_fernet() -> Fernet:
    key = os.getenv("VOTE_ENCRYPTION_KEY")
    if not key:
        raise ValueError("VOTE_ENCRYPTION_KEY is not configured")
    return Fernet(key.encode())


def build_voter_hash(voter_id: str, event_id: str) -> str:
    return hashlib.sha256(f"{voter_id}:{event_id}".encode()).hexdigest()


def decrypt_vote_payload(fernet: Fernet, encrypted_payload: str, event_id: str | None = None) -> dict | None:
    try:
        return json.loads(fernet.decrypt(encrypted_payload.encode()).decode())
    except InvalidToken:
        if event_id:
            logger.warning("Invalid vote payload for event %s", event_id)
        else:
            logger.warning("Invalid vote payload encountered")
        return None


def has_voted(event_id: str, voter_id: str) -> bool:
    voter_hash = build_voter_hash(voter_id, event_id)
    votes = votes_repo.read()
    return any(vote["voterIdHash"] == voter_hash for vote in votes)


def get_user_vote(event_id: str, voter_id: str) -> dict | None:
    voter_hash = build_voter_hash(voter_id, event_id)
    votes = votes_repo.read()
    fernet = get_fernet()
    for vote in votes:
        if vote["voterIdHash"] != voter_hash or vote["eventId"] != event_id:
            continue
        payload = decrypt_vote_payload(fernet, vote["encryptedPayload"], event_id)
        if payload is not None:
            return payload
    return None


def get_event_general_average(event_id: str) -> int | None:
    scores = decrypt_event_scores(event_id)
    if not scores:
        return None
    return round(sum(scores) / len(scores))


def decrypt_event_scores(event_id: str) -> list[float]:
    votes = votes_repo.read()
    fernet = get_fernet()
    scores: list[float] = []

    for vote in votes:
        if vote["eventId"] != event_id:
            continue
        payload = decrypt_vote_payload(fernet, vote["encryptedPayload"], event_id)
        if payload is None:
            continue
        scores.append((payload["fun"] + payload["cost"] + payload["originality"]) / 3)

    return scores


def get_vote_averages_by_event() -> dict[str, float]:
    votes = votes_repo.read()
    fernet = get_fernet()
    grouped: dict[str, list[float]] = {}

    for vote in votes:
        payload = decrypt_vote_payload(fernet, vote["encryptedPayload"], vote["eventId"])
        if payload is None:
            continue
        value = (payload["fun"] + payload["cost"] + payload["originality"]) / 3
        grouped.setdefault(vote["eventId"], []).append(value)

    return {event_id: sum(values) / len(values) for event_id, values in grouped.items() if values}
