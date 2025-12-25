from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any
from ..models.devis import Devis, Ligne

Q = Decimal("0.01")
def D(x) -> Decimal:
    return Decimal(str(x))

def apply_remise(amount: Decimal, mode: str, valeur: float) -> Decimal:
    if not valeur:
        return amount
    if mode == "percent":
        return (amount * (Decimal("1") - D(valeur)/Decimal("100"))).quantize(Q, rounding=ROUND_HALF_UP)
    else:
        return max(Decimal("0"), (amount - D(valeur))).quantize(Q, rounding=ROUND_HALF_UP)

def compute_totaux(d: Devis) -> Dict[str, Any]:
    """
    Recalcule les totaux d'un devis (HT, TVA, TTC, Acompte, Reste à payer).
    Retourne un dictionnaire avec les valeurs calculées.
    """
    total_ht = Decimal("0")
    tva_tot = Decimal("0")
    tva_map: Dict[str, Decimal] = {}
    
    # Calcul lignes
    for l in d.lignes:
        if l.pu_ht is None:
            lht = Decimal("0.00")
        else:
            lht = (D(l.pu_ht) * D(l.qte)).quantize(Q, rounding=ROUND_HALF_UP)
        
        # Update line total in object (if we want to persist it, though it's computed)
        l.total_ht = float(lht)
        
        total_ht += lht
        r = Decimal(str(l.tva or 0))
        t = (lht * r).quantize(Q, rounding=ROUND_HALF_UP)
        tva_tot += t
        
        key = f"{int(round(float(r)*100))}%"
        tva_map[key] = (tva_map.get(key, Decimal("0")) + t).quantize(Q, rounding=ROUND_HALF_UP)

    # Remise globale
    total_ht = apply_remise(total_ht, d.remise_mode, d.remise_valeur)
    
    # Totaux finaux
    ht_float = float(total_ht)
    tva_float = float(tva_tot)
    ttc_float = float((total_ht + tva_tot).quantize(Q))
    
    # Acompte
    acompte_ttc = 0.0
    if d.acompte_valeur:
        if d.acompte_mode == "percent":
            acompte_ttc = float((D(ttc_float) * (D(d.acompte_valeur)/Decimal("100"))).quantize(Q))
        else:
            acompte_ttc = float(min(D(ttc_float), D(d.acompte_valeur)).quantize(Q))
            
    reste_ttc = float((D(ttc_float) - D(acompte_ttc)).quantize(Q))

    return {
        "ht": ht_float,
        "tva": tva_float,
        "ttc": ttc_float,
        "tva_by_rate": {k: float(v) for k, v in tva_map.items()},
        "acompte_ttc": acompte_ttc,
        "reste_a_payer_ttc": reste_ttc
    }
