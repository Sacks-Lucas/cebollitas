import os

import cloudinary
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes import (  # noqa: E402
    admin,
    auth,
    cebollitas_matches,
    events,
    matches,
    monthly_events,
    rankings,
    roles,
    trips,
    users,
    votes,
)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

app = FastAPI(title="Cebollitas Oficial API")

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(matches.router)
app.include_router(cebollitas_matches.router)
app.include_router(events.router)
app.include_router(rankings.router)
app.include_router(monthly_events.router)
app.include_router(trips.router)
app.include_router(votes.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
