import os
from datetime import datetime, timedelta, timezone

from google.auth.transport import requests
from google.oauth2 import id_token
from jose import JWTError, jwt

from repositories.data_store import get_allowed_users


ALGORITHM = "HS256"


def verify_google_token(token: str) -> str:
    allow_mock_auth = os.getenv("ALLOW_MOCK_AUTH", "true").lower() == "true"
    if allow_mock_auth and token.startswith("mock:"):
        return token.removeprefix("mock:")

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not google_client_id:
        raise ValueError("Google client id is not configured.")

    info = id_token.verify_oauth2_token(token, requests.Request(), google_client_id)
    email = info.get("email")
    if not email:
        raise ValueError("Google token does not include an email.")
    return email


def create_access_token(payload: dict) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT secret is not configured.")

    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode(data, secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT secret is not configured.")

    try:
        return jwt.decode(token, secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def find_user_by_email(email: str) -> dict | None:
    users = get_allowed_users()
    return next((user for user in users if user["email"].lower() == email.lower()), None)
