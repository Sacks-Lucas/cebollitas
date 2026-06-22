"""sync_sheet_matches.py — Weekly bidirectional sync: Google Sheet <-> DB.

Reconciles the football `matches` collection with the source Google Sheet. The
sheet tab is the current year (e.g. "2026"), resolved automatically so it keeps
working every January without code changes.

The sync is *additive by union*, which is the safe shape of bidirectional:
  - rows present in the Sheet but not in the DB  -> INSERT into the DB   (Sheet -> DB)
  - matches present in the DB but not in the Sheet -> APPEND to the Sheet (DB -> Sheet)
  - records present on both sides:
        identical  -> left untouched
        different  -> reported as a CONFLICT, never overwritten blindly

Records are matched by a *natural key* (user + date + stadium), not by the stored
`id`, so inserting a row in the middle of the Sheet does not desync anything.

Environment:
  MONGODB_URI                  picks the backend (Mongo when set, else local JSON)
  SYNC_SHEET_ID                spreadsheet id (defaults to the Cebollitas sheet)
  SYNC_YEAR                    override the tab name (defaults to current year)
  SYNC_DRY_RUN=true            compute + report, write nothing (recommended first run)
  GOOGLE_SERVICE_ACCOUNT_JSON  service-account key as raw JSON (preferred on Render)
  GOOGLE_APPLICATION_CREDENTIALS  ...or a path to the key file (local dev)

Run from the api/ directory:
    venv/Scripts/python.exe scripts/sync_sheet_matches.py
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

DEFAULT_SHEET_ID = "1iBuxhbkd7vKGyjC8VeCtRmFDYsLeAw5ySW4PvTPPFSI"

# Sheet column order (1-based): Nombre | Fecha del partido | Resultado | Goles | Estadio.
COL_NAME, COL_DATE, COL_RESULT, COL_GOALS, COL_STADIUM = 0, 1, 2, 3, 4

# Excel result (Spanish) <-> canonical English code stored in the collection.
RESULT_BY_LABEL = {"victoria": "win", "derrota": "loss", "empate": "draw"}
LABEL_BY_RESULT = {v: k for k, v in RESULT_BY_LABEL.items()}

# Excel nickname (lowercased) -> canonical full name in allowed_users.
NAME_BY_NICK = {
    "luqui": "Lucas Mateo Sacks",
    "petro": "Martin Petrone",
    "renzo": "Renzo Tamburella",
    "axel": "Axel Reynoso",
    "nacho": "Ignacio Calvo",
    "pela": "Nicolas Escobar",
    "char": "Carlos Martinez Devesa",
    "cala": "Santiago Cala",
    "mateo": "Mateo Lozano",
}
# Canonical full name -> display nickname used when appending rows to the Sheet.
NICK_BY_NAME = {
    "Lucas Mateo Sacks": "Luqui",
    "Martin Petrone": "Petro",
    "Renzo Tamburella": "Renzo",
    "Axel Reynoso": "Axel",
    "Ignacio Calvo": "Nacho",
    "Nicolas Escobar": "Pela",
    "Carlos Martinez Devesa": "Char",
    "Santiago Cala": "Cala",
    "Mateo Lozano": "Mateo",
}


def _clean(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_date(value: object) -> date | None:
    """Parse a sheet date cell. gspread returns strings; accept a few formats."""
    if isinstance(value, datetime):
        return value.date()
    text = _clean(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _parse_goals(value: object) -> int:
    """Missing/blank goals count as 0 so stats aggregate cleanly."""
    text = _clean(value)
    if text is None:
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def _natural_key(user_id: str, day: date, stadium: str | None) -> tuple[str, str, str]:
    """Position-independent identity of a match."""
    return (user_id, day.isoformat(), (stadium or "").strip().lower())


def _match_id(key: tuple[str, str, str]) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, "cebollitas:match:" + ":".join(key)))


# --------------------------------------------------------------------------- #
# Google Sheets access
# --------------------------------------------------------------------------- #
def _open_worksheet(year: str):
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError:
        raise SystemExit("ERROR: gspread not installed. Run: pip install gspread google-auth")

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if raw:
        creds = Credentials.from_service_account_info(json.loads(raw), scopes=scopes)
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        creds = Credentials.from_service_account_file(
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"], scopes=scopes
        )
    else:
        raise SystemExit(
            "ERROR: no Google credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or "
            "GOOGLE_APPLICATION_CREDENTIALS."
        )

    client = gspread.authorize(creds)
    sheet_id = os.getenv("SYNC_SHEET_ID", DEFAULT_SHEET_ID)
    spreadsheet = client.open_by_key(sheet_id)
    try:
        return spreadsheet.worksheet(year)
    except gspread.WorksheetNotFound:
        raise SystemExit(f"ERROR: worksheet {year!r} not found in spreadsheet {sheet_id}.")


def _read_sheet_matches(worksheet, user_id_by_nick: dict[str, str], report: "Report") -> dict:
    """Return {natural_key: match_dict} parsed from the worksheet (header skipped)."""
    rows = worksheet.get_all_values()
    out: dict = {}
    for i, row in enumerate(rows[1:], start=2):  # row 1 is the header
        cells = row + [""] * (5 - len(row))  # pad short rows
        name = _clean(cells[COL_NAME])
        day = _parse_date(cells[COL_DATE])
        result_label = _clean(cells[COL_RESULT])
        stadium = _clean(cells[COL_STADIUM])

        if not any([name, result_label, cells[COL_DATE], cells[COL_GOALS], stadium]):
            continue  # fully empty row
        if not name or day is None or not result_label:
            report.skipped.append(f"Sheet row {i}: missing name/date/result")
            continue

        user_id = user_id_by_nick.get(name.lower())
        if user_id is None:
            report.skipped.append(f"Sheet row {i}: unmapped nickname {name!r}")
            continue
        result = RESULT_BY_LABEL.get(result_label.lower())
        if result is None:
            report.skipped.append(f"Sheet row {i}: unknown result {result_label!r}")
            continue

        key = _natural_key(user_id, day, stadium)
        out[key] = {
            "id": _match_id(key),
            "userId": user_id,
            "date": day.isoformat(),
            "result": result,
            "goals": _parse_goals(cells[COL_GOALS]),
            "stadium": stadium,
        }
    return out


# --------------------------------------------------------------------------- #
# Reporting
# --------------------------------------------------------------------------- #
class Report:
    def __init__(self) -> None:
        self.inserted_db: list[str] = []
        self.appended_sheet: list[str] = []
        self.conflicts: list[str] = []
        self.skipped: list[str] = []
        self.warnings: list[str] = []

    def print(self, dry_run: bool) -> None:
        header = "DRY RUN — no changes written" if dry_run else "Sync complete"
        print(f"\n=== {header} ===")
        print(f"  Sheet -> DB inserts:   {len(self.inserted_db)}")
        for line in self.inserted_db:
            print(f"    + {line}")
        print(f"  DB -> Sheet appends:   {len(self.appended_sheet)}")
        for line in self.appended_sheet:
            print(f"    + {line}")
        print(f"  Conflicts (untouched): {len(self.conflicts)}")
        for line in self.conflicts:
            print(f"    ! {line}")
        print(f"  Skipped rows:          {len(self.skipped)}")
        for line in self.skipped:
            print(f"    - {line}")
        if self.warnings:
            print(f"  Warnings:              {len(self.warnings)}")
            for line in self.warnings:
                print(f"    ~ {line}")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> None:
    dry_run = os.getenv("SYNC_DRY_RUN", "").lower() in ("1", "true", "yes")
    year = os.getenv("SYNC_YEAR") or str(datetime.now().year)
    report = Report()

    from repositories.data_store import get_allowed_users, matches_repo

    users = get_allowed_users()
    id_by_name = {u["name"]: u["id"] for u in users}
    missing = sorted({n for n in NAME_BY_NICK.values() if n not in id_by_name})
    if missing:
        raise SystemExit(f"ERROR: mapped names not in allowed_users: {missing}")
    user_id_by_nick = {nick: id_by_name[name] for nick, name in NAME_BY_NICK.items()}
    name_by_id = {uid: name for name, uid in id_by_name.items()}

    worksheet = _open_worksheet(year)
    sheet_by_key = _read_sheet_matches(worksheet, user_id_by_nick, report)

    db_matches = matches_repo.read()
    db_by_key: dict = {}
    for m in db_matches:
        day = _parse_date(m.get("date"))
        if day is None or not m.get("userId"):
            report.warnings.append(f"DB match {m.get('id')}: bad date/userId, skipped")
            continue
        db_by_key[_natural_key(m["userId"], day, m.get("stadium"))] = m

    def _label(key: tuple[str, str, str], m: dict) -> str:
        nick = NICK_BY_NAME.get(name_by_id.get(m["userId"], ""), m["userId"])
        return f"{nick} {m['date']} {m.get('stadium') or '-'} ({m['result']}, {m['goals']}g)"

    # Sheet -> DB: keys only in the sheet.
    to_insert = [sheet_by_key[k] for k in sheet_by_key.keys() - db_by_key.keys()]
    for m in to_insert:
        report.inserted_db.append(_label(_natural_key(m["userId"], _parse_date(m["date"]), m["stadium"]), m))

    # DB -> Sheet: keys only in the DB.
    to_append_keys = db_by_key.keys() - sheet_by_key.keys()
    append_rows: list[list] = []
    for k in to_append_keys:
        m = db_by_key[k]
        nick = NICK_BY_NAME.get(name_by_id.get(m["userId"], ""))
        if nick is None:
            report.warnings.append(f"DB match {m.get('id')}: user has no Sheet nickname, not appended")
            continue
        append_rows.append([
            nick,
            m["date"],
            LABEL_BY_RESULT.get(m["result"], m["result"]),
            m.get("goals", 0),
            m.get("stadium") or "",
        ])
        report.appended_sheet.append(_label(k, m))

    # Present on both sides but differing -> conflict (never overwritten).
    for k in sheet_by_key.keys() & db_by_key.keys():
        s, d = sheet_by_key[k], db_by_key[k]
        if s["result"] != d["result"] or int(s["goals"]) != int(d.get("goals", 0)):
            report.conflicts.append(
                f"{_label(k, d)}  Sheet=({s['result']},{s['goals']}g) DB=({d['result']},{d.get('goals', 0)}g)"
            )

    if not dry_run:
        if to_insert:
            merged = list(db_matches) + to_insert
            matches_repo.write(merged)
        if append_rows:
            worksheet.append_rows(append_rows, value_input_option="USER_ENTERED")

    report.print(dry_run)


if __name__ == "__main__":
    main()
