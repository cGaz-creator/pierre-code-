from typing import Optional
from sqlmodel import SQLModel, Field
import uuid

class ClientBase(SQLModel):
    nom: str = Field(index=True)
    client_type: str = Field(default="particulier") # particulier, pro
    adresse: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    adresse_chantier: Optional[str] = None
    entreprise_nom: Optional[str] = Field(default=None, index=True) # Scoped to Enterprise Name

class Client(ClientBase, table=True):
    id: Optional[str] = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
