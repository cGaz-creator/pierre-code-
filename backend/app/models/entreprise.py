from typing import Optional
from sqlmodel import SQLModel, Field

class EntrepriseBase(SQLModel):
    nom: str
    forme: Optional[str] = None  # SARL, SAS, EI...
    siret: Optional[str] = None
    rm_rcs: Optional[str] = None # RCS Paris B 123...
    tva_intracom: Optional[str] = None
    adresse: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    logo_url: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    
    # Assurance Décennale
    assurance_nom: Optional[str] = None
    assurance_contact: Optional[str] = None # Adresse/Tel de l'assureur

class EntrepriseCreate(EntrepriseBase):
    password: str

class EntrepriseLogin(SQLModel):
    nom: str
    password: str

class Entreprise(EntrepriseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: Optional[str] = None
