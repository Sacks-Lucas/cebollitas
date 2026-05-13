# Cebollitas Oficial

## Project summary
Cebollitas Oficial is a private group scoring app that tracks attendance and organizer points for yearly events. It is a JSON-persistence monorepo with a FastAPI backend and a React frontend.

## Language convention
All code, comments, docs, and commits are in English. All user-facing UI copy is in rioplatense Spanish.

## Architecture map
- Frontend pages: `/web/src/pages`
- Frontend reusable components: `/web/src/components`
- Backend routes: `/api/routes`
- Backend business services: `/api/services`
- JSON persistence files: `/api/data`

## Key business rules
- At least 4 attendees are required per event.
- Only `creatorId` can edit/delete their own event.
- Votes must be encrypted and individual votes must never be exposed.
- Only attendees can vote an event.
- Only one vote per user per event (`voterIdHash`).
- Scoring is automatic by `eventType` in `scoring_service.py`.

## Commands
- Frontend: `cd web && npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`
- Backend: `cd api && make dev`, `make test`, `make lint`

## Common pitfalls
- Do not add a database; persistence must stay JSON-only.
- Do not break vote anonymity.
- Do not hardcode UI strings in components; use `/web/src/i18n/es.ts`.
- Do not trust `creatorId` from request payloads; derive it from JWT.
