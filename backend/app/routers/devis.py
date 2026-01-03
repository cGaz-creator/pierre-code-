from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List, Optional
import io

from ..db.database import get_session
from ..models.devis import Devis, DevisUpdate
from ..models.entreprise import Entreprise
from ..services.pdf_service import generate_pdf
from ..services.email_service import send_email
from pydantic import BaseModel, EmailStr

router = APIRouter()

class EmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    message: str


@router.patch("/devis/{devis_id}", response_model=Devis)
def update_devis(devis_id: str, devis_update: DevisUpdate, session: Session = Depends(get_session)):
    devis = session.get(Devis, devis_id)
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    
    devis_data = devis_update.dict(exclude_unset=True)
    for key, value in devis_data.items():
        setattr(devis, key, value)
    
    session.add(devis)
    session.commit()
    session.refresh(devis)
    return devis

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
    # 2. Get Entreprise
    # Fallback: if devis has no entreprise_nom (old data), try to get from client
    if not devis.entreprise_nom and devis.client and devis.client.entreprise_nom:
        devis.entreprise_nom = devis.client.entreprise_nom
        session.add(devis)
        session.commit()
        session.refresh(devis)
    
    if not devis.entreprise_nom:
         raise HTTPException(status_code=400, detail="Devis sans entreprise associée")

    ent_stmt = select(Entreprise).where(Entreprise.nom == devis.entreprise_nom)
    entreprise = session.exec(ent_stmt).first()

    if not entreprise:
        raise HTTPException(status_code=404, detail="L'entreprise associée à ce devis n'existe plus")
    
    pdf_bytes = generate_pdf(devis, entreprise)
    
    # Determine filename
    filename = f"devis-{devis_id}.pdf"
    if devis.objet:
        # Basic sanitization
        safe_name = "".join([c if c.isalnum() or c in (' ', '-', '_') else '_' for c in devis.objet])
        safe_name = safe_name.strip().replace(' ', '_')
        if safe_name:
            filename = f"{safe_name}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.post("/devis/{devis_id}/send")
async def send_devis_email(devis_id: str, email_req: EmailRequest, session: Session = Depends(get_session)):
    # 1. Reuse logic to get Devis + Enterprise + PDF bytes
    devis = session.get(Devis, devis_id)
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    
    # Ensure Enterprise linkage
    if not devis.entreprise_nom and devis.client and devis.client.entreprise_nom:
        devis.entreprise_nom = devis.client.entreprise_nom
    
    if not devis.entreprise_nom:
         raise HTTPException(status_code=400, detail="Devis sans entreprise associée")

    ent_stmt = select(Entreprise).where(Entreprise.nom == devis.entreprise_nom)
    entreprise = session.exec(ent_stmt).first()

    if not entreprise:
        raise HTTPException(status_code=404, detail="L'entreprise associée n'existe plus")
    
    # Generate PDF
    pdf_bytes = generate_pdf(devis, entreprise)
    
    # Determine filename
    filename = f"devis-{devis_id}.pdf"
    if devis.objet:
        safe_name = "".join([c if c.isalnum() or c in (' ', '-', '_') else '_' for c in devis.objet])
        safe_name = safe_name.strip().replace(' ', '_')
        if safe_name: filename = f"{safe_name}.pdf"

    # 2. Attachments
    # UploadFile-like structure for fastapi-mail? No, MessageSchema takes 'attachments' as files or UploadFile.
    # But valid attachments can be dicts or bytes?
    # According to fastapi-mail docs, we can pass a list of UploadFile OR a list of dicts.
    # However, passing in-memory bytes is tricky with fastapi-mail < 1.0. 
    # Workaround: Use EmailSchema with 'attachments' as list of files or paths.
    # For in-memory bytes, version 1.4+ supports it via a specific class or dict.
    # Let's try the dict format: {'file': bytes, 'filename': str, 'content_type': str, 'headers': dict}
    
    attachment = {
        "file": pdf_bytes,
        "filename": filename,
        "content_type": "application/pdf",
        "headers": {}
    }

    # 3. Send Email
    await send_email(
        recipients=[email_req.to_email],
        subject=email_req.subject,
        body=email_req.message,
        attachments=[attachment]
    )
    
    return {"ok": True, "detail": "Email envoyé avec succès"}
