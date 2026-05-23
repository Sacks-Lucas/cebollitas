import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from repositories.data_store import DATA_DIR

IMAGES_DIR = DATA_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024

SAFE_FILENAME = re.compile(r"^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$")


def save_uploaded_image(upload: UploadFile) -> str:
    if not upload.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Falta el nombre del archivo.")

    ext = upload.filename.rsplit(".", 1)[-1].lower()
    if ext == "jpeg":
        ext = "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido. Usá: {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )

    content = upload.file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen excede el tamaño máximo (5 MB).",
        )

    filename = f"{uuid4().hex}.{ext}"
    target_path = IMAGES_DIR / filename
    target_path.write_bytes(content)

    return f"/api/monthly-events/images/{filename}"


def get_image_path(filename: str) -> Path:
    if not SAFE_FILENAME.match(filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de archivo inválido.")
    path = IMAGES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imagen no encontrada.")
    return path
