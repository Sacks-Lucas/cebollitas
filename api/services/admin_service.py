from services.roles_service import ROLE_ADMIN, has_role


def is_admin(user: dict) -> bool:
    return has_role(user, ROLE_ADMIN)
