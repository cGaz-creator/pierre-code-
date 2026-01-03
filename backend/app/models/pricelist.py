from typing import Optional
from sqlmodel import SQLModel, Field

class PriceItemBase(SQLModel):
    label: str
    price_ht: float
    unit: str = "u"   # u, m2, ml, h...
    category: str = "Toutes"
    tva: float = 20.0
    
    entreprise_id: Optional[int] = Field(default=None, foreign_key="entreprise.id")

class PriceItem(PriceItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
