from fastapi import APIRouter, HTTPException, status

from models.schemas import AuthGoogleRequest, AuthResponse, User
from services.auth_service import create_access_token, find_user_by_email, verify_google_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/google", response_model=AuthResponse)
def login_with_google(payload: AuthGoogleRequest) -> AuthResponse:
    try:
        email = verify_google_token(payload.token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No pudimos validar tu cuenta de Google.") from exc

    user = find_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está autorizada para acceder a Cebollitas Oficial.",
        )

    token = create_access_token({"userId": user["id"], "email": user["email"], "name": user["name"]})
    return AuthResponse(token=token, user=User.model_validate(user))
