import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import admin, auth, events, monthly_events, rankings, users, votes

load_dotenv()

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
app.include_router(events.router)
app.include_router(rankings.router)
app.include_router(monthly_events.router)
app.include_router(votes.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
