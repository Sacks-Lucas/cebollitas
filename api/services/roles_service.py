"""Role helpers.

Roles are stored as a small collection (see data/roles.json) and each allowed
user carries a `roles` array of role ids. Identities flowing through the app
(JWT payload) only hold id/email/name, so role checks resolve the user's roles
from the store by id (falling back to email) rather than trusting the token.
"""

from fastapi import Depends, HTTPException, status

from repositories.data_store import get_allowed_users

ROLE_ADMIN = "ADMIN"
ROLE_CEBOLLITAS = "CEBOLLITAS"
ROLE_FUTBOL = "FUTBOL"


def get_user_roles(user: dict) -> list[str]:
    """Resolve the roles of an identity from the allowed-users store.

    Matches by id first, then email, so it works for both the JWT identity and
    a full user dict. Returns an empty list when the user is not found.
    """
    users = get_allowed_users()
    user_id = user.get("id")
    email = (user.get("email") or "").lower()
    match = next(
        (
            candidate
            for candidate in users
            if (user_id and candidate["id"] == user_id)
            or (email and candidate["email"].lower() == email)
        ),
        None,
    )
    return list(match.get("roles", [])) if match else []


def has_role(user: dict, role: str) -> bool:
    return role in get_user_roles(user)


def require_roles(*roles: str):
    """Dependency factory that allows access if the user has any of `roles`."""

    # Imported lazily to avoid a circular import: dependencies -> admin_service
    # -> roles_service would otherwise loop back here at module load.
    from dependencies import get_current_user

    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_roles = get_user_roles(current_user)
        if not any(role in user_roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permiso para realizar esta acción.",
            )
        return current_user

    return dependency
