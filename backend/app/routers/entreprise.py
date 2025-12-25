from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from passlib.context import CryptContext
from ..db.database import get_session
from ..models.entreprise import Entreprise, EntrepriseBase, EntrepriseCreate, EntrepriseLogin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/entreprise/login")
def login_entreprise(data: EntrepriseLogin, session: Session = Depends(get_session)):
    statement = select(Entreprise).where(Entreprise.nom == data.nom)
    ent = session.exec(statement).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    if not ent.password_hash or not pwd_context.verify(data.password, ent.password_hash):
         raise HTTPException(status_code=401, detail="Mot de passe incorrect")
         
    return ent

@router.post("/entreprise/register")
def register_entreprise(data: EntrepriseCreate, session: Session = Depends(get_session)):
    statement = select(Entreprise).where(Entreprise.nom == data.nom)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cette entreprise existe déjà")
    
    hashed_password = pwd_context.hash(data.password)
    ent_data = data.dict(exclude={"password"})
    ent = Entreprise(**ent_data, password_hash=hashed_password)
    
    session.add(ent)
    session.commit()
    session.refresh(ent)
    return ent
