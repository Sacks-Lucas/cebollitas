import io

import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024
CLOUDINARY_FOLDER = "cebollitas/monthly-events"


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

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            folder=CLOUDINARY_FOLDER,
            resource_type="image",
        )
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo subir la imagen al almacenamiento remoto.",
        ) from exc

    secure_url = result.get("secure_url")
    if not secure_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Respuesta inesperada del almacenamiento remoto.",
        )
    return secure_url
