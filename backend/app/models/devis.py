from typing import List, Optional, Dict
from sqlmodel import SQLModel, Field, Relationship
from datetime import date as dt_date
import uuid
from .client import Client

class LigneBase(SQLModel):
    ligne_type: str = Field(default="prestation")
    designation: str
    qte: float = 1.0
    unite: str = "u"
    pu_ht: Optional[float] = None
    tva: float = 0.2
    lot: Optional[str] = None
    option: bool = False
    note: Optional[str] = None
    total_ht: Optional[float] = None

class Ligne(LigneBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    devis_id: Optional[str] = Field(default=None, foreign_key="devis.id")
    devis: Optional["Devis"] = Relationship(back_populates="lignes")

# --- Devis ---
class DevisBase(SQLModel):
    date: dt_date = Field(default_factory=dt_date.today)
    devise: str = "EUR"
    statut: str = "brouillon"
    theme: str = "modern_plus"
    accent_hex: str = "#0EA5E9"
    cta_url: Optional[str] = None
    objet: Optional[str] = None
    
    # Conditions
    validite_jours: int = 30
    paiement: str = "Virement"
    notes: Optional[str] = None
    
    # Remise globale / Acompte (stored as JSON or simple fields)
    remise_valeur: float = 0.0
    remise_mode: str = "percent"
    acompte_valeur: float = 0.0
    acompte_mode: str = "percent"

    # Detailed description (New requirement)
    detailed_description: Optional[str] = None
    
    # Scoping
    entreprise_nom: Optional[str] = Field(default=None, index=True)

class Devis(DevisBase, table=True):
    id: str = Field(default_factory=lambda: f"DV-{dt_date.today().year}-{uuid.uuid4().hex[:6].upper()}", primary_key=True)
    
    client_id: Optional[str] = Field(default=None, foreign_key="client.id")
    client: Optional[Client] = Relationship()
    
    lignes: List[Ligne] = Relationship(back_populates="devis")

class DevisUpdate(SQLModel):
    objet: Optional[str] = None
    theme: Optional[str] = None
    accent_hex: Optional[str] = None
    statut: Optional[str] = None
