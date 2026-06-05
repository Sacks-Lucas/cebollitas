"""One-off migration: load bundled JSON data into MongoDB.

Run from the `api/` directory with MONGODB_URI set (e.g. in .env):

    python scripts/migrate_json_to_mongo.py

Existing non-empty collections are skipped so the script is safe to re-run.
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from repositories.mongo_repository import COLLECTION_KINDS, MongoRepository  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

COLLECTIONS = [
    "allowed_users",
    "roles",
    "monthly_assignments",
    "events",
    "trips",
    "votes",
]


def main() -> None:
    if not os.getenv("MONGODB_URI"):
        raise SystemExit("MONGODB_URI is not set. Aborting.")

    for name in COLLECTIONS:
        path = DATA_DIR / f"{name}.json"
        if not path.exists():
            print(f"skip {name}: no JSON file found")
            continue

        with path.open("r", encoding="utf-8") as fh:
            docs = json.load(fh)

        repo = MongoRepository(name, COLLECTION_KINDS.get(name, "list"))
        existing = repo.read()
        if existing:
            print(f"skip {name}: collection already has {len(existing)} entries")
            continue

        repo.write(docs)
        print(f"migrated {name}: {len(docs)} docs")

    print("Done.")


if __name__ == "__main__":
    main()
