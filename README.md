# Cebollitas Oficial

Private monorepo for a yearly friend-group scoring app. The frontend lives in `web` (React + TypeScript + Tailwind) and the backend lives in `api` (FastAPI + JSON persistence).

## Repository structure

- `web/`: React app
- `api/`: FastAPI app

## Frontend setup

```bash
cd web
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Backend setup

```bash
cd api
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

The API runs on `http://localhost:8000`.

## Generate vote encryption key

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Set the value in `VOTE_ENCRYPTION_KEY`.

## Add a new allowed user

Edit `api/data/allowed_users.json` and append:

```json
{ "name": "Full Name", "email": "user@example.com" }
```

`id` is auto-generated and persisted on first load if omitted.

## Deployment notes

- Deploy `web/` to Vercel.
- Deploy `api/` to Render.
- Mount a Persistent Disk in Render at `/api/data` so JSON files survive redeploys.
