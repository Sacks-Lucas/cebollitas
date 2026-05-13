import io
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@router.get("/backup")
def backup(_: dict = Depends(get_current_user)) -> StreamingResponse:
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in DATA_DIR.glob("*.json"):
            zip_file.write(file_path, arcname=file_path.name)

    memory_file.seek(0)
    return StreamingResponse(
        memory_file,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=cebollitas-backup.zip"},
    )
