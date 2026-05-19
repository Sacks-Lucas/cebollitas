ADMIN_EMAILS = {
    "sackslm0@gmail.com",
}


def is_admin(user: dict) -> bool:
    return user.get("email") in ADMIN_EMAILS
