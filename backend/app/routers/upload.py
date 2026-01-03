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
from ..db.database import get_session
from sqlmodel import Session, select
from fastapi import Depends, Form
from ..models.pricelist import PriceItem
from ..models.entreprise import Entreprise

@router.post("/upload/price-list")
async def upload_price_list(
    file: UploadFile = File(...), 
    entreprise_nom: str = Form(...),
    session: Session = Depends(get_session)
):
    try:
        # 1. Find Enterprise
        ent = session.exec(select(Entreprise).where(Entreprise.nom == entreprise_nom)).first()
        if not ent:
             raise HTTPException(status_code=404, detail="Entreprise introuvable")

        # 2. Save file temporarily
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"temp_pricelist_{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Parse file
        items_data = parse_price_list_file(str(file_path), file_ext)
        
        # 4. Save to DB
        saved_items = []
        for i in items_data:
            # Clean numeric values
            try:
                price = float(i.get('price_ht', 0))
                tva = float(i.get('tva_rate', 0.2))
            except:
                price = 0
                tva = 0.2
                
            new_item = PriceItem(
                label=i.get('label', 'Sans nom'),
                price_ht=price,
                unit=i.get('unit', 'u'),
                category=i.get('category', 'Général'),
                tva=tva,
                entreprise_id=ent.id
            )
            session.add(new_item)
            saved_items.append(new_item)
            
        session.commit()
        
        # Cleanup
        # os.remove(file_path)
        
        return {"items": items_data, "count": len(saved_items)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
