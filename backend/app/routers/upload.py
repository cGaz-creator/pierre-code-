import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("app/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL (assuming server runs on localhost:8000)
        # In production, this should be configurable
        return {"url": f"http://localhost:8000/static/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from ..services.price_parser_service import parse_price_list_file

@router.post("/upload/price-list")
async def upload_price_list(file: UploadFile = File(...)):
    try:
        # Save file temporarily
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"temp_pricelist_{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse file
        items = parse_price_list_file(str(file_path), file_ext)
        
        # Cleanup
        # os.remove(file_path) # Optional: keep it for debugging or delete
        
        return {"items": items}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
