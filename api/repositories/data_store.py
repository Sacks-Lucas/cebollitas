import os
import shutil
import uuid
from pathlib import Path

from repositories.json_repository import JsonRepository

BASE_DIR = Path(__file__).resolve().parent.parent
BUNDLED_DATA_DIR = BASE_DIR / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(BUNDLED_DATA_DIR))).resolve()


def _seed_data_dir() -> None:
    """Copy bundled seed JSON files into DATA_DIR on first boot.

    When DATA_DIR points to a persistent volume (e.g. on Render), the volume
    starts empty. We copy the JSON files bundled with the repo so the app boots
    with the same baseline data as local dev. Existing files are never
    overwritten, so user-generated data on the volume is preserved across
    deploys.
    """
    if DATA_DIR == BUNDLED_DATA_DIR:
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for seed_file in BUNDLED_DATA_DIR.glob("*.json"):
        target = DATA_DIR / seed_file.name
        if not target.exists():
            shutil.copy2(seed_file, target)


_seed_data_dir()

allowed_users_repo = JsonRepository(DATA_DIR / "allowed_users.json")
monthly_assignments_repo = JsonRepository(DATA_DIR / "monthly_assignments.json")
events_repo = JsonRepository(DATA_DIR / "events.json")
trips_repo = JsonRepository(DATA_DIR / "trips.json")
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
