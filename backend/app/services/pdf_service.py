import io
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from ..models.devis import Devis
from ..models.entreprise import Entreprise
from ..services.calc_service import compute_totaux

# Themes configuration (copied from original)
THEMES = {
    "classic": {
        "label": "Classique",
        "accent_hex": "#111827",
        "table_header_fill": "#F3F4F6",
        "header_band": None,
        "cards": False,
    },
    "modern_plus": {
        "label": "Modern+",
        "accent_hex": "#0EA5E9",
        "table_header_fill": "#E0F2FE",
        "header_band": {"height_mm": 10},
        "cards": True,
    },
    "creative": {
        "label": "Créatif",
        "accent_hex": "#16A34A",
        "table_header_fill": "#DCFCE7",
        "header_band": {"height_mm": 18, "diagonal": True},
        "cards": True,
    },
    "bold": {
        "label": "Bold",
        "accent_hex": "#EC4899",
        "table_header_fill": "#FCE7F3",
        "header_band": {"height_mm": 16, "right_tag": True},
        "cards": True,
    },
    "minimalist": {
        "label": "Minimalist",
        "accent_hex": "#000000",
        "table_header_fill": "#FFFFFF",
        "header_band": None,
        "cards": False,
        "classic_layout": True # Special flag for layout
    }
}


def hex_to_color(h: str) -> colors.Color:
    if not h: return colors.HexColor("#111827")
    h = h.strip()
    if not h.startswith("#"): h = "#" + h
    try: return colors.HexColor(h)
    except: return colors.HexColor("#111827")

def _draw_kv(c, x, y, k, v, bold=False, size=9):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, f"{k}")
    c.setFont("Helvetica", size)
    c.drawString(x+90, y, f": {v}")

def _money(v):
    try: return f"{float(v):.2f} €"
    except: return str(v)

def _render_header_band(c, theme_cfg, accent: colors.Color, w, h):
    band = theme_cfg.get("header_band")
    if not band: return
    hh = band.get("height_mm", 12) * mm
    c.setFillColor(accent)
    if band.get("diagonal"):
        c.saveState()
        c.translate(0, h-hh)
        c.rect(0, 0, w, hh, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.restoreState()
    elif band.get("right_tag"):
        c.rect(0, h-hh, w, hh, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.polygon([w-40*mm, h-hh, w, h-hh, w, h], fill=1, stroke=0)
    else:
        c.rect(0, h-hh, w, hh, fill=1, stroke=0)

def generate_pdf(d: Devis, e: Entreprise) -> bytes:
    # Ensure totals are computed
    totaux = compute_totaux(d)
    
    theme_name = d.theme if d.theme in THEMES else "modern_plus"
    theme_cfg = THEMES[theme_name]
    accent = hex_to_color(d.accent_hex or theme_cfg["accent_hex"])
    head_fill = hex_to_color(theme_cfg.get("table_header_fill") or "#F3F4F6")

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Bandeau
    _render_header_band(c, theme_cfg, accent, w, h)

    # Logo
    if e.logo_url:
        try:
            logo_src = (e.logo_url or "").strip()
            img_reader = None
            if logo_src.startswith("data:image"):
                header, b64data = logo_src.split(",", 1)
                img_bytes = base64.b64decode(b64data)
                img_reader = ImageReader(io.BytesIO(img_bytes))
            else:
                img_reader = ImageReader(logo_src)
            
            # Positionnement Logo (Minimalist vs Standard)
            if theme_cfg.get("classic_layout"):
                c.drawImage(img_reader, 20*mm, h - 35*mm, 25*mm, 25*mm, preserveAspectRatio=True, mask="auto")
            else:
                c.drawImage(img_reader, w - 40*mm, h - 30*mm, 20*mm, 20*mm, preserveAspectRatio=True, mask="auto")
        except: pass

    # En-tête 
    y = h - 30*mm
    
    # --- MODE MINIMALIST SPECIAL LAYOUT ---
    if theme_cfg.get("classic_layout"):
         # DEVIS Box Top Right
        c.setLineWidth(1)
        c.rect(w - 70*mm, h - 25*mm, 50*mm, 12*mm)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(w - 45*mm, h - 21*mm, "DEVIS")
        
        # Enterprise Info (Left below logo)
        y = h - 45*mm
        c.setFont("Helvetica-Bold", 11); c.setFillColor(colors.black)
        c.drawString(20*mm, y, e.nom); y -= 5*mm
        c.setFont("Helvetica", 9); c.setFillColor(colors.grey)
        
        def draw_ent_line_min(txt):
             nonlocal y
             if txt: c.drawString(20*mm, y, txt); y -= 4*mm

        draw_ent_line_min(e.adresse)
        draw_ent_line_min(f"SIRET: {e.siret}")
        draw_ent_line_min(e.email)
        draw_ent_line_min(e.tel)
        
        # Client Info Box (Right)
        c.setFillColor(colors.HexColor("#F3F4F6")) # Gray bg
        c.rect(w - 90*mm, h - 70*mm, 70*mm, 35*mm, fill=1, stroke=0)
        c.setFillColor(colors.black)
        
        yc = h - 70*mm + 28*mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(w - 85*mm, yc, "Client :"); yc -= 5*mm
        if d.client:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(w - 85*mm, yc, d.client.nom); yc -= 5*mm
            c.setFont("Helvetica", 9)
            c.drawString(w - 85*mm, yc, d.client.adresse or ""); yc -= 4*mm
            c.drawString(w - 85*mm, yc, d.client.email or ""); yc -= 4*mm
        
        # Devis Details (Below Enterprise)
        y = min(y, h - 80*mm)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20*mm, y, f"Devis N°: {d.readable_id}"); y -= 5*mm
        c.setFont("Helvetica", 10)
        c.drawString(20*mm, y, f"Date: {d.date}"); y -= 5*mm
        
        # Reset Y for body
        y = h - 110*mm

    else:
        # --- STANDARD LAYOUT (Modern, Bold, etc.) ---
        # Col Gauche : Entreprise
        c.setFont("Helvetica-Bold", 12); c.setFillColor(colors.black)
        c.drawString(20*mm, y, e.nom)
        y -= 5*mm
        c.setFont("Helvetica", 9); c.setFillColor(colors.grey)
        def draw_ent_line(txt):
            nonlocal y
            if txt: c.drawString(20*mm, y, txt); y -= 4*mm

        draw_ent_line(e.adresse)
        draw_ent_line(f"{e.forme or ''} au capital social".strip() if e.forme else "")
        draw_ent_line(f"SIRET : {e.siret}")
        if e.rm_rcs: draw_ent_line(f"RCS/RM : {e.rm_rcs}")
        if e.tva_intracom: draw_ent_line(f"TVA : {e.tva_intracom}")
        draw_ent_line(e.email)
        draw_ent_line(e.tel)
        
        # Col Droite : Devis & Client
        y_right = h - 30*mm
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 18)
        c.drawRightString(190*mm, y_right, f"DEVIS N° {d.readable_id}")
        y_right -= 8*mm
        
        c.setFillColor(colors.black); c.setFont("Helvetica", 10)
        c.drawRightString(190*mm, y_right, f"Date : {d.date}")
        y_right -= 5*mm
        if d.validite_jours:
            c.drawRightString(190*mm, y_right, f"Valable jusqu'au : {d.date} (+{d.validite_jours}j)")
            y_right -= 5*mm

        y_right -= 5*mm
        # Client Box
        c.setFillColor(colors.whitesmoke)
        c.roundRect(100*mm, y_right - 35*mm, 90*mm, 35*mm, 4*mm, fill=1, stroke=0)
        c.setFillColor(colors.black)
        
        c.setFont("Helvetica-Bold", 10)
        c.drawString(105*mm, y_right - 6*mm, "Client :")
        c.setFont("Helvetica-Bold", 11)
        if d.client:
            c.drawString(105*mm, y_right - 12*mm, d.client.nom)
            c.setFont("Helvetica", 10)
            c.drawString(105*mm, y_right - 17*mm, d.client.adresse or "Adresse non renseignée")
            c.drawString(105*mm, y_right - 22*mm, d.client.email or "")
            c.drawString(105*mm, y_right - 27*mm, d.client.tel or "")
        else:
            c.drawString(105*mm, y_right - 12*mm, "Client Inconnu")

        # Objet & Dates travaux
        y = min(y, y_right - 40*mm) - 10*mm
    
    # Common Objet/Travaux section (for all except if crowded in Minimal)
    if d.objet:
        c.setFont("Helvetica-Bold", 11); c.setFillColor(colors.black)
        c.drawString(20*mm, y, f"Objet : {d.objet}")
        y -= 6*mm
    
    if d.date_debut or d.duree_travaux:
        c.setFont("Helvetica", 9)
        txt = "Travaux : "
        if d.date_debut: txt += f"Début le {d.date_debut} "
        if d.duree_travaux: txt += f"(Durée estimée : {d.duree_travaux})"
        c.drawString(20*mm, y, txt)
        y -= 6*mm
    if d.objet:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, f"Objet : {d.objet}")
        y -= 6*mm
    
    if d.date_debut or d.duree_travaux:
        c.setFont("Helvetica", 9)
        txt = "Travaux : "
        if d.date_debut: txt += f"Début le {d.date_debut} "
        if d.duree_travaux: txt += f"(Durée estimée : {d.duree_travaux})"
        c.drawString(20*mm, y, txt)
        y -= 6*mm

    # Tableau Lignes
    y -= 5*mm
    c.setLineWidth(0.6)
    c.setFillColor(head_fill)
    c.rect(20*mm, y, 170*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    
    # Headers
    c.drawString(22*mm,  y+2.2*mm, "Désignation")
    c.drawRightString(130*mm, y+2.2*mm, "Qté")
    c.drawRightString(150*mm, y+2.2*mm, "PU HT")
    c.drawRightString(165*mm, y+2.2*mm, "TVA")
    c.drawRightString(185*mm, y+2.2*mm, "Total HT")
    y -= 6*mm # Bottom of header

    c.setFont("Helvetica", 9)
    for l in d.lignes:
        if y < 60*mm: c.showPage(); w, h = A4; y = h - 30*mm
        
        # Designation wraps
        des = (l.designation or "")
        # Simple wrap logic or truncation
        if len(des) > 60: des = des[:60] + "..."
        
        c.drawString(22*mm, y, des)
        c.drawRightString(130*mm, y, f"{l.qte:g} {l.unite}")
        pu = "-" if l.pu_ht is None else _money(l.pu_ht)
        c.drawRightString(150*mm, y, pu)
        c.drawRightString(165*mm, y, f"{l.tva*100:.0f}%")
        c.drawRightString(185*mm, y, _money(l.total_ht or 0.0))
        y -= 5*mm
        if l.note:
            c.setFont("Helvetica-Oblique", 8); c.setFillColor(colors.grey)
            c.drawString(22*mm, y, f"  {l.note[:90]}")
            c.setFillColor(colors.black); c.setFont("Helvetica", 9)
            y -= 4*mm

    # Totaux
    y -= 5*mm
    c.setLineWidth(0.3); c.line(120*mm, y, 190*mm, y); y -= 4*mm
    
    # Total Bloc
    c.setFont("Helvetica", 10); 
    c.drawRightString(170*mm, y, "Total HT :"); c.drawRightString(190*mm, y, _money(totaux["ht"])); y -= 5*mm
    c.drawRightString(170*mm, y, "Total TVA :"); c.drawRightString(190*mm, y, _money(totaux["tva"])); y -= 6*mm
    
    c.setFillColor(accent); c.setFont("Helvetica-Bold", 12)
    c.drawRightString(170*mm, y, "Net à payer :"); c.drawRightString(190*mm, y, _money(totaux["ttc"]))
    c.setFillColor(colors.black); y -= 10*mm

    # --- Footer Block (Mentions Légales & Signature) ---
    
    # Check space
    if y < 50*mm: c.showPage(); w, h = A4; y = h - 30*mm
    
    # Bank
    if e.iban:
        c.setFont("Helvetica-Bold", 9); c.drawString(20*mm, y, "Coordonnées Bancaires")
        y -= 4*mm
        c.setFont("Helvetica", 8)
        c.drawString(20*mm, y, f"IBAN : {e.iban}  BIC : {e.bic}")
        y -= 6*mm

    # Legal Text
    c.setFont("Helvetica", 8); c.setFillColor(colors.darkgrey)
    legal_text = [
        f"Validité du devis : {d.validite_jours} jours.",
        f"Conditions de règlement : {d.conditions_reglement or 'À réception'}.",
        "Assurance : " + (f"Garantie Décennale {e.assurance_nom} ({e.assurance_contact})" if e.assurance_nom else "Non spécifiée (Obligatoire pour le gros œuvre)"),
        "En cas de retard de paiement, application d'une indemnité forfaitaire de 40€.",
        "Gestion des déchets : Sauf mention contraire, l'évacuation des gravats est à la charge du client.",
        "Médiation : En cas de litige, le consommateur peut saisir le médiateur de la consommation compétent."
    ]
    for line in legal_text:
        c.drawString(20*mm, y, line)
        y -= 3.5*mm
    
    # Signature Box
    y_sig = y - 10*mm
    c.setFillColor(colors.black); c.setStrokeColor(colors.black)
    c.rect(130*mm, y_sig - 25*mm, 60*mm, 25*mm, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(132*mm, y_sig - 4*mm, "Bon pour accord")
    c.setFont("Helvetica", 8)
    c.drawString(132*mm, y_sig - 8*mm, "Date et Signature :")

    # Description détaillée (Restored)
    if d.detailed_description:
        c.showPage(); w, h = A4; y = h - 30*mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Description détaillée des travaux")
        y -= 5*mm
        c.setFont("Helvetica", 9)
        text_obj = c.beginText(20*mm, y)
        from reportlab.lib.utils import simpleSplit
        lines = simpleSplit(d.detailed_description, "Helvetica", 9, 170*mm)
        for line in lines:
            text_obj.textLine(line)
        c.drawText(text_obj)

    c.showPage(); c.save()
    return buf.getvalue()
