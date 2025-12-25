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
            if img_reader:
                c.drawImage(img_reader, w - 40*mm, h - 30*mm, 20*mm, 20*mm, preserveAspectRatio=True, mask="auto")
        except: pass

    # En-tête
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20*mm, h-18*mm, f"Devis {d.id}")
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 9)
    c.drawString(20*mm, h-24*mm, f"Date : {d.date}   Devise : {d.devise}")
    if d.objet:
        c.setFont("Helvetica", 10)
        c.drawString(20*mm, h-29*mm, f"Objet : {d.objet}")

    # Cartes
    y = h - 40*mm
    if theme_cfg.get("cards"):
        c.setFillColor(colors.whitesmoke); c.roundRect(18*mm, y-24*mm, 80*mm, 26*mm, 4*mm, fill=1, stroke=0)
        c.roundRect(112*mm, y-24*mm, 80*mm, 26*mm, 4*mm, fill=1, stroke=0)
    c.setFillColor(colors.black)

    c.setFont("Helvetica-Bold", 11); c.drawString(20*mm, y, "Entreprise")
    c.setFont("Helvetica", 9)
    y1 = y-6*mm
    _draw_kv(c, 20*mm, y1, "Nom", e.nom, True); y1-=5*mm
    _draw_kv(c, 20*mm, y1, "SIRET", e.siret or ""); y1-=5*mm
    _draw_kv(c, 20*mm, y1, "Email", e.email or ""); y1-=5*mm
    _draw_kv(c, 20*mm, y1, "Tel", e.tel or "")

    c.setFont("Helvetica-Bold", 11); c.drawString(114*mm, y, "Client")
    if d.client:
        cl = d.client
        y2 = y-6*mm; c.setFont("Helvetica", 9)
        _draw_kv(c, 114*mm, y2, "Nom", cl.nom or "", True); y2-=5*mm
        _draw_kv(c, 114*mm, y2, "Adresse", cl.adresse or ""); y2-=5*mm
        _draw_kv(c, 114*mm, y2, "Email", cl.email or ""); y2-=5*mm
    else:
        y2 = y-6*mm
        c.drawString(114*mm, y2, "Client non renseigné")

    # Tableau Lignes
    y = y2 - 15*mm
    c.setLineWidth(0.6)
    c.setFillColor(head_fill)
    c.rect(20*mm, y, 170*mm, 8*mm, fill=1, stroke=0) # Reduced width slightly
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(22*mm,  y+2.2*mm, "Désignation")
    c.drawRightString(140*mm, y+2.2*mm, "Qté")
    c.drawRightString(160*mm, y+2.2*mm, "PU HT")
    c.drawRightString(185*mm, y+2.2*mm, "Total HT")
    y -= 6*mm
    c.line(20*mm, y, 190*mm, y)
    y -= 4*mm

    c.setFont("Helvetica", 9)
    for l in d.lignes:
        if y < 40*mm: c.showPage(); w, h = A4; y = h - 30*mm
        
        des = (l.designation or "")[:90]
        c.drawString(22*mm, y, des)
        c.drawRightString(140*mm, y, f"{l.qte:.2f} {l.unite}")
        pu = "-" if l.pu_ht is None else _money(l.pu_ht)
        c.drawRightString(160*mm, y, pu)
        c.drawRightString(185*mm, y, _money(l.total_ht or 0.0))
        y -= 5*mm
        if l.note:
            c.setFont("Helvetica-Oblique", 8); c.setFillColor(colors.grey)
            c.drawString(22*mm, y, f"• {l.note[:100]}")
            c.setFillColor(colors.black); c.setFont("Helvetica", 9)
            y -= 4*mm

    # Totaux
    y -= 6*mm
    c.setLineWidth(0.6); c.line(120*mm, y, 190*mm, y); y -= 4*mm
    
    c.setFont("Helvetica-Bold", 10); c.drawRightString(170*mm, y, "Total HT :")
    c.setFont("Helvetica", 10); c.drawRightString(190*mm, y, _money(totaux["ht"])); y -= 5*mm

    c.setFont("Helvetica-Bold", 10); c.drawRightString(170*mm, y, "Total TVA :")
    c.setFont("Helvetica", 10); c.drawRightString(190*mm, y, _money(totaux["tva"])); y -= 6*mm

    c.setFillColor(accent); c.setFont("Helvetica-Bold", 12)
    c.drawRightString(170*mm, y, "Total TTC :")
    c.drawRightString(190*mm, y, _money(totaux["ttc"]))
    c.setFillColor(colors.black); y -= 8*mm

    # Description détaillée (New feature)
    if d.detailed_description:
        if y < 60*mm: c.showPage(); w, h = A4; y = h - 30*mm
        y -= 10*mm
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
        y -= (len(lines) * 4*mm + 10*mm)

    c.showPage(); c.save()
    return buf.getvalue()
