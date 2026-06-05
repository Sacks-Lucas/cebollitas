from fastapi import APIRouter, Depends

from dependencies import get_current_user
from models.schemas import Role
from repositories.data_store import get_roles

router = APIRouter(prefix="/api", tags=["roles"])


@router.get("/roles", response_model=list[Role])
def list_roles(_: dict = Depends(get_current_user)) -> list[Role]:
    return [Role.model_validate(role) for role in get_roles()]
