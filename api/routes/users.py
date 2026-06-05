from fastapi import APIRouter, Depends

from dependencies import get_current_user
from models.schemas import User
from repositories.data_store import get_allowed_users

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/users", response_model=list[User])
def list_users(_: dict = Depends(get_current_user)) -> list[User]:
    return [User.model_validate(user) for user in get_allowed_users()]


@router.get("/me", response_model=User)
def me(current_user: dict = Depends(get_current_user)) -> User:
    # The JWT identity only carries id/email/name, so resolve the stored user to
    # include roles. Fall back to the token identity if not found.
    stored = next((user for user in get_allowed_users() if user["id"] == current_user["id"]), None)
    return User.model_validate(stored or current_user)
