"""
migrate_images.py — One-time migration: local image files → Cloudinary.

Walks api/data/images/, uploads each file to Cloudinary, and rewrites every
matching `imageUrl` entry in api/data/events.json from the legacy local path
(`/api/monthly-events/images/<filename>`) to the Cloudinary `secure_url`.

Run with:
    api/.venv/Scripts/python.exe api/scripts/migrate_images.py

Requirements:
    api/.env must contain CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
    CLOUDINARY_API_SECRET.

Safe to re-run: events whose `imageUrl` already points to https://... are
skipped. Files in api/data/images/ that aren't referenced by any event are
also skipped (with a warning).
"""

import json
import os
import sys
from pathlib import Path

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

API_DIR = Path(__file__).resolve().parent.parent
IMAGES_DIR = API_DIR / "data" / "images"
EVENTS_JSON = API_DIR / "data" / "events.json"
LEGACY_PREFIX = "/api/monthly-events/images/"
CLOUDINARY_FOLDER = "cebollitas/monthly-events"


def main() -> int:
    load_dotenv(API_DIR / ".env")

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not (cloud_name and api_key and api_secret):
        print("ERROR: missing CLOUDINARY_* env vars in api/.env", file=sys.stderr)
        return 1

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )

    if not EVENTS_JSON.is_file():
        print(f"ERROR: events.json not found at {EVENTS_JSON}", file=sys.stderr)
        return 1
    if not IMAGES_DIR.is_dir():
        print(f"ERROR: images dir not found at {IMAGES_DIR}", file=sys.stderr)
        return 1

    events = json.loads(EVENTS_JSON.read_text(encoding="utf-8"))

    # Map filename -> list of event indexes that reference it via the legacy path.
    refs: dict[str, list[int]] = {}
    for idx, event in enumerate(events):
        image_url = event.get("imageUrl")
        if not isinstance(image_url, str):
            continue
        if not image_url.startswith(LEGACY_PREFIX):
            continue
        filename = image_url[len(LEGACY_PREFIX) :]
        refs.setdefault(filename, []).append(idx)

    if not refs:
        print("Nothing to migrate: no events reference legacy image paths.")
        return 0

    local_files = {p.name for p in IMAGES_DIR.iterdir() if p.is_file()}
    missing_locally = sorted(set(refs) - local_files)
    if missing_locally:
        print("WARNING: referenced in events.json but missing on disk:")
        for name in missing_locally:
            print(f"  - {name}")

    orphans = sorted(local_files - set(refs))
    if orphans:
        print("WARNING: present on disk but not referenced by any event (skipped):")
        for name in orphans:
            print(f"  - {name}")

    uploaded = 0
    failed: list[str] = []
    for filename, indexes in sorted(refs.items()):
        path = IMAGES_DIR / filename
        if not path.is_file():
            failed.append(f"{filename} (missing locally)")
            continue
        print(f"Uploading {filename} ...", end=" ", flush=True)
        try:
            result = cloudinary.uploader.upload(
                str(path),
                folder=CLOUDINARY_FOLDER,
                resource_type="image",
            )
        except Exception as exc:  # noqa: BLE001
            print("FAILED")
            print(f"  -> {exc}")
            failed.append(filename)
            continue
        secure_url = result.get("secure_url")
        if not secure_url:
            print("FAILED (no secure_url)")
            failed.append(filename)
            continue
        print("ok")
        for idx in indexes:
            events[idx]["imageUrl"] = secure_url
        uploaded += 1

    EVENTS_JSON.write_text(
        json.dumps(events, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print()
    print(f"Migrated {uploaded} image(s). events.json rewritten.")
    if failed:
        print(f"Failed: {len(failed)}")
        for name in failed:
            print(f"  - {name}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
