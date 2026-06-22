# Weekly Sheet ↔ DB sync — setup guide

The script [`sync_sheet_matches.py`](sync_sheet_matches.py) reconciles the
football `matches` collection with the source Google Sheet once a week. It is an
**additive union**: new rows in the Sheet are inserted into the DB, new matches
in the DB are appended to the Sheet, and records that exist on both sides but
differ are reported as conflicts (never overwritten).

## 1. Create a Google service account (one-time, ~10 min)

This is the only manual step and only has to be done once.

1. Go to <https://console.cloud.google.com/> and create a project (or reuse one).
2. **APIs & Services → Library →** enable the **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account.**
   Give it a name (e.g. `cebollitas-sync`) and create it.
4. Open the service account → **Keys → Add key → Create new key → JSON.**
   A `.json` file downloads. Keep it secret — it never gets committed.
5. Copy the service account's email (looks like
   `cebollitas-sync@<project>.iam.gserviceaccount.com`).
6. Open the Google Sheet, click **Share**, and add that email as **Editor**.

## 2. Configure credentials

The script reads the key from an environment variable (preferred) or a file.

- **On Render** (production): paste the *entire contents* of the JSON file into
  an env var named `GOOGLE_SERVICE_ACCOUNT_JSON`.
- **Local dev**: either do the same, or set
  `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.

Other variables:

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | (unset → local JSON) | DB backend; same value as the web service |
| `SYNC_SHEET_ID` | the Cebollitas sheet | spreadsheet id (from its URL) |
| `SYNC_YEAR` | current year | tab name override (testing) |
| `SYNC_DRY_RUN` | `false` | `true` = report changes but write nothing |

## 3. Test locally before scheduling

From the `api/` directory, with the venv active:

```sh
pip install -r requirements.txt
SYNC_DRY_RUN=true python scripts/sync_sheet_matches.py
```

A dry run prints exactly what *would* change (inserts, appends, conflicts)
without touching anything. Once it looks right, drop `SYNC_DRY_RUN`.

## 4. Schedule it on Render (Mondays)

Two options:

- **Blueprint**: commit [`render.yaml`](../../render.yaml) and let Render create
  the Cron Job, then fill in the `sync: false` secrets in the dashboard.
- **By hand**: dashboard → **New → Cron Job**, root dir `api`, schedule
  `0 12 * * 1` (Mon 09:00 ART), build `pip install -r requirements.txt`,
  start `python scripts/sync_sheet_matches.py`, and add the env vars above.

Each run's output (the report) shows up in the Cron Job's logs in Render.

## Notes

- Matches are identified by a **natural key** (user + date + stadium), so
  inserting rows in the middle of the Sheet does not desync anything.
- The Sheet's nicknames map to canonical users via `NAME_BY_NICK` in the script.
  If a new player joins, add them there and to `allowed_users.json`.
- The script never deletes — removing a row in one place does not delete it in
  the other. That keeps the sync safe; deletions stay manual.
