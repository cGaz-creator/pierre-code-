import os
import pandas as pd
from pypdf import PdfReader
from openai import OpenAI
import json
from ..models.llm import LLMQuoteResponse # We might need a new model for price items

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_price_list_file(file_path: str, file_ext: str) -> list[dict]:
    text_content = ""
    
    try:
        if file_ext.lower() in ['.xlsx', '.xls', '.csv']:
            if file_ext.lower() == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            text_content = df.to_string()
        elif file_ext.lower() == '.pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
        else:
            # Try reading as text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    # Use LLM to extract structured data
    prompt = """
    Tu es un expert en BTP et data analysis.
    Ta mission : Transformer ce fichier (CSV/Excel/Texte) en une liste structurée d'articles pour un logiciel de devis.

    Règles d'extraction :
    1. EXTENSION : Trouve tous les articles possibles. Ne t'arrête pas au premier.
    2. LABEL (Désignation) : Traduis/Corrige si nécessaire pour avoir un nom clair en français.
    3. PRIX (HT) : Extrait le prix numérique (convertis si besoin). Si manquant, mets 0.
    4. UNITE : Déduis l'unité (u, m2, ml, h, ens, fft). Par défaut "u".
    5. CATEGORIE : Déduis une catégorie logique (ex: Plomberie, Electricité, Main d'oeuvre) selon le libellé.

    Format de sortie JSON Strict :
    {
        "items": [
            {"label": "Désignation claire", "price_ht": 0.0, "unit": "u", "category": "Catégorie", "tva_rate": 0.2},
            ...
        ]
    }
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text_content[:60000]} # Increased context for larger catalogs
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("items", [])
    except Exception as e:
        print(f"LLM Extraction Error: {e}")
        return []
