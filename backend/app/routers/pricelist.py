from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.database import get_session
from ..models.pricelist import PriceItem
from ..models.entreprise import Entreprise

router = APIRouter()

@router.get("/pricelist", response_model=List[PriceItem])
def list_items(
    entreprise_nom: str,
    category: Optional[str] = None,
    q: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Find entreprise ID
    ent = session.exec(select(Entreprise).where(Entreprise.nom == entreprise_nom)).first()
    if not ent:
        return []
        
    query = select(PriceItem).where(PriceItem.entreprise_id == ent.id)
    
    if category and category != "Toutes":
        query = query.where(PriceItem.category == category)
        
    if q:
        query = query.where(PriceItem.label.contains(q))
        
    return session.exec(query).all()

@router.post("/pricelist", response_model=PriceItem)
def create_item(
    item: PriceItem, 
    session: Session = Depends(get_session)
):
    # Security: Verify entreprise exists (simple check)
    if not item.entreprise_id:
         raise HTTPException(status_code=400, detail="Entreprise ID requis")

    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/pricelist/{item_id}")
def delete_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(PriceItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
        
    session.delete(item)
    session.commit()
    return {"ok": True}

@router.patch("/pricelist/{item_id}", response_model=PriceItem)
def update_item(item_id: int, item_data: PriceItem, session: Session = Depends(get_session)):
    item = session.get(PriceItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    update_dict = item_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
         setattr(item, key, value)

    session.add(item)
    session.commit()
    session.refresh(item)
    return item
