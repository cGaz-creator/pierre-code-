from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from ..db.database import get_session
from ..models.client import Client

router = APIRouter()

@router.post("/clients", response_model=Client)
def create_client(client: Client, session: Session = Depends(get_session)):
    session.add(client)
    session.commit()
    session.refresh(client)
    return client

@router.get("/clients", response_model=List[Client])
def search_clients(q: Optional[str] = None, entreprise_nom: Optional[str] = None, session: Session = Depends(get_session)):
    statement = select(Client)
    
    # Filter by Enterprise
    if entreprise_nom:
        statement = statement.where(Client.entreprise_nom == entreprise_nom)
        
    if q:
        statement = statement.where(Client.nom.contains(q))
    
    statement = statement.limit(10)
    return session.exec(statement).all()
