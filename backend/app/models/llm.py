from typing import List, Optional
from pydantic import BaseModel, Field

class LLMQuoteLine(BaseModel):
    label: str = Field(..., description="Désignation de la ligne")
    quantity: float = Field(..., description="Quantité")
    unit: str = Field(default="u", description="Unité (u, m2, h, etc.)")
    unit_price_ht: Optional[float] = Field(None, description="Prix unitaire HT. Null si inconnu.")
    tva_rate: float = Field(default=0.2, description="Taux de TVA (0.2 = 20%)")
    lot: Optional[str] = Field(None, description="Lot ou catégorie")
    note: Optional[str] = Field(None, description="Note ou description courte")

class LLMQuoteResponse(BaseModel):
    action: str = Field(..., description="Action à effectuer: 'update_quote', 'ask_clarification', 'just_chat'")
    lines: List[LLMQuoteLine] = Field(default_factory=list, description="Liste des lignes à ajouter ou remplacer")
    detailed_description: Optional[str] = Field(None, description="Description détaillée du devis si demandée")
    assistant_message: str = Field(..., description="Message de réponse pour l'utilisateur")
    questions_for_user: List[str] = Field(default_factory=list, description="Questions pour clarifier le besoin")
