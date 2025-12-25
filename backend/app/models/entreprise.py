from typing import Optional
from sqlmodel import SQLModel, Field

class EntrepriseBase(SQLModel):
    nom: str
    forme: Optional[str] = None
    siret: Optional[str] = None
    tva_intracom: Optional[str] = None
    adresse: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    logo_url: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None

class EntrepriseCreate(EntrepriseBase):
    password: str

class EntrepriseLogin(SQLModel):
    nom: str
    password: str

class Entreprise(EntrepriseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: Optional[str] = None
