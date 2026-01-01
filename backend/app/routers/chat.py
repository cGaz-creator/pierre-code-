from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Optional, List
from pydantic import BaseModel

from ..db.database import get_session
from ..models.devis import Devis, Ligne
from ..models.client import Client
from ..models.entreprise import Entreprise
from ..services.llm_service import propose_quote_update
from ..services.calc_service import compute_totaux

router = APIRouter()

class TurnIn(BaseModel):
    session_id: str
    message: str
    includeDetailedDescription: bool = False
    price_list: Optional[List[dict]] = None

@router.post("/chat/turn")
def chat_turn(inp: TurnIn, session: Session = Depends(get_session)):
    # ... (existing code) ...
    
    # ... (existing code finding devis) ...
    statement = select(Devis).where(Devis.id == inp.session_id)
    devis = session.exec(statement).first()
    
    if not devis:
        raise HTTPException(status_code=404, detail="Session/Devis not found")

    # 2. Call LLM Service
    llm_response = propose_quote_update(
        message_user=inp.message,
        devis=devis,
        include_detailed_description=inp.includeDetailedDescription,
        price_list=inp.price_list
    )
    
    # 3. Apply actions
    if llm_response.action == "update_quote":
        # Strategy: Replace ALL lines to avoid duplication/state issues.
        # The LLM is instructed to return the full state.
        
        # Delete existing lines
        for old_line in devis.lignes:
            session.delete(old_line)
        
        # Add new lines
        for l in llm_response.lines:
            new_line = Ligne(
                designation=l.label,
                qte=l.quantity,
                unite=l.unit,
                pu_ht=l.unit_price_ht,
                tva=l.tva_rate,
                lot=l.lot,
                note=l.note,
                devis_id=devis.id
            )
            session.add(new_line)
        
        if llm_response.detailed_description:
            devis.detailed_description = llm_response.detailed_description
            session.add(devis)
            
        session.commit()
        session.refresh(devis)
    
    # 4. Compute Totals
    totaux = compute_totaux(devis)
    
    # 5. Format Response (Compatible with old frontend)
    # Old frontend expects: { session_id, assistant_message, chips, devis_id, devis: {...} }
    
    # We need to serialize Devis with lines and totals
    devis_dict = devis.dict()
    devis_dict["lignes"] = [l.dict() for l in devis.lignes]
    devis_dict["totaux"] = totaux
    # Add meta fields expected by old front
    devis_dict["meta"] = {
        "devis_id": devis.id,
        "date": devis.date,
        "statut": devis.statut,
        "theme": devis.theme,
        "accent_hex": devis.accent_hex,
        "objet": devis.objet
    }
    # Add client/entreprise if needed by front (it usually expects them nested)
    if devis.client:
        devis_dict["client"] = devis.client.dict()
    
    # Chips logic (simple)
    chips = []
    if devis.lignes:
        chips = ["Voir PDF", "Modifier"]

    return {
        "session_id": inp.session_id,
        "assistant_message": llm_response.assistant_message,
        "chips": chips,
        "devis_id": devis.id,
        "devis": devis_dict
    }

class StartIn(BaseModel):
    client_id: Optional[str] = None
    client: Optional[dict] = None # We accept a dict to be flexible, or we could use ClientBase
    theme: str = "modern_plus"
    entreprise_nom: Optional[str] = None

@router.post("/chat/start")
def chat_start(inp: StartIn, session: Session = Depends(get_session)):
    # Create new Devis
    new_devis = Devis(theme=inp.theme, entreprise_nom=inp.entreprise_nom)
    
    if inp.client_id:
        new_devis.client_id = inp.client_id
    elif inp.client:
        # Create new client from data
        # Handle 'type' -> 'client_type' mapping manually or rely on model
        client_data = inp.client.copy()
        if 'type' in client_data:
            client_data['client_type'] = client_data.pop('type')
            
        new_client = Client(**client_data)
        session.add(new_client)
        session.commit()
        session.refresh(new_client)
        new_devis.client_id = new_client.id
    
    session.add(new_devis)
    session.commit()
    session.refresh(new_devis)
    
    # Return compatible response
    # session_id = devis_id for simplicity in this new architecture
    # Compute initial totals (should be 0)
    from ..services.calc_service import compute_totaux
    totaux = compute_totaux(new_devis)

    devis_dict = new_devis.dict()
    devis_dict["lignes"] = []
    devis_dict["totaux"] = totaux
    devis_dict["meta"] = {
        "devis_id": new_devis.id,
        "date": new_devis.date,
        "statut": new_devis.statut,
        "theme": new_devis.theme,
        "accent_hex": new_devis.accent_hex,
        "objet": new_devis.objet
    }
    if new_devis.client:
        devis_dict["client"] = new_devis.client.dict()

    return {
        "session_id": new_devis.id, 
        "assistant_message": "Bonjour ! Je suis prêt à créer votre devis. Dites-moi ce qu'il faut chiffrer.",
        "chips": [],
        "devis_id": new_devis.id,
        "devis": devis_dict
    }
