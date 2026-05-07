import hashlib
import json
import os

from cryptography.fernet import Fernet

from repositories.data_store import votes_repo


def get_fernet() -> Fernet:
    key = os.getenv("VOTE_ENCRYPTION_KEY")
    if not key:
        raise ValueError("VOTE_ENCRYPTION_KEY is not configured")
    return Fernet(key.encode())


def build_voter_hash(voter_id: str, event_id: str) -> str:
    return hashlib.sha256(f"{voter_id}:{event_id}".encode()).hexdigest()


def has_voted(event_id: str, voter_id: str) -> bool:
    voter_hash = build_voter_hash(voter_id, event_id)
    votes = votes_repo.read()
    return any(vote["voterIdHash"] == voter_hash for vote in votes)


def decrypt_event_scores(event_id: str) -> list[float]:
    votes = votes_repo.read()
    fernet = get_fernet()
    scores: list[float] = []

    for vote in votes:
        if vote["eventId"] != event_id:
            continue
        payload = json.loads(fernet.decrypt(vote["encryptedPayload"].encode()).decode())
        scores.append((payload["fun"] + payload["cost"] + payload["originality"]) / 3)

    return scores


def get_vote_averages_by_event() -> dict[str, float]:
    votes = votes_repo.read()
    fernet = get_fernet()
    grouped: dict[str, list[float]] = {}

    for vote in votes:
        payload = json.loads(fernet.decrypt(vote["encryptedPayload"].encode()).decode())
        value = (payload["fun"] + payload["cost"] + payload["originality"]) / 3
        grouped.setdefault(vote["eventId"], []).append(value)

    return {event_id: sum(values) / len(values) for event_id, values in grouped.items() if values}
