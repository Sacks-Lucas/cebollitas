import uuid
from pathlib import Path

from repositories.json_repository import JsonRepository

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

allowed_users_repo = JsonRepository(DATA_DIR / "allowed_users.json")
monthly_assignments_repo = JsonRepository(DATA_DIR / "monthly_assignments.json")
events_repo = JsonRepository(DATA_DIR / "events.json")
votes_repo = JsonRepository(DATA_DIR / "votes.json")


def get_allowed_users() -> list[dict]:
    users = allowed_users_repo.read()
    changed = False
    for user in users:
        if not user.get("id"):
            user["id"] = str(uuid.uuid4())
            changed = True
    if changed:
        allowed_users_repo.write(users)
    return users
