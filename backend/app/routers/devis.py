from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List, Optional
import io

from ..db.database import get_session
from ..models.devis import Devis
from ..models.entreprise import Entreprise
from ..services.pdf_service import generate_pdf

router = APIRouter()

@router.get("/devis", response_model=List[Devis])
def list_devis(entreprise_nom: Optional[str] = None, session: Session = Depends(get_session)):
    statement = select(Devis)
    if entreprise_nom:
        statement = statement.where(Devis.entreprise_nom == entreprise_nom)
    # Sort by date desc
    statement = statement.order_by(Devis.date.desc())
    return session.exec(statement).all()

@router.get("/devis/{devis_id}/pdf")
def get_devis_pdf(devis_id: str, session: Session = Depends(get_session)):
    devis = session.get(Devis, devis_id)
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    
    # Get Entreprise (Singleton ID=1)
    # Get associated Enterprise
    if not devis.entreprise_nom:
         raise HTTPException(status_code=400, detail="Devis sans entreprise associée")

    ent_stmt = select(Entreprise).where(Entreprise.nom == devis.entreprise_nom)
    entreprise = session.exec(ent_stmt).first()

    if not entreprise:
        raise HTTPException(status_code=404, detail="L'entreprise associée à ce devis n'existe plus")
    
    pdf_bytes = generate_pdf(devis, entreprise)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="devis-{devis_id}.pdf"'},
    )
