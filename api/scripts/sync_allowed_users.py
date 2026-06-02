"""Sync the allowed_users list from the bundled JSON into MongoDB.

The source of truth for allowed users is api/data/allowed_users.json (see
README). Run this after editing that file to push name/email changes to Mongo.

Matches existing users by `id`: updates name + email when they differ, adds
users that are new, and leaves users that only exist in Mongo untouched (it
never deletes).

Run from the api/ directory with MONGODB_URI set:

    python scripts/sync_allowed_users.py
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from repositories.mongo_repository import MongoRepository  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def main() -> None:
    if not os.getenv("MONGODB_URI"):
        raise SystemExit("MONGODB_URI is not set. Aborting.")

    with (DATA_DIR / "allowed_users.json").open("r", encoding="utf-8") as fh:
        json_users = json.load(fh)

    repo = MongoRepository("allowed_users")
    by_id = {user["id"]: user for user in repo.read()}

    added = 0
    updated = 0
    for user in json_users:
        existing = by_id.get(user["id"])
        if existing is None:
            by_id[user["id"]] = user
            added += 1
            print(f"add    {user['name']} <{user['email']}>")
            continue
        if existing.get("name") != user["name"] or existing.get("email") != user["email"]:
            print(f"update {existing.get('email')} -> {user['email']} ({user['name']})")
            existing["name"] = user["name"]
            existing["email"] = user["email"]
            updated += 1

    repo.write(list(by_id.values()))
    print(f"Done. {updated} updated, {added} added, {len(by_id)} total.")


if __name__ == "__main__":
    main()
