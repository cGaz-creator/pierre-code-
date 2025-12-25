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
    Tu es un assistant expert en BTP.
    Analyse le texte suivant qui provient d'un catalogue de prix ou d'un devis type.
    Extrait une liste d'articles avec :
    - label (désignation)
    - price_ht (prix unitaire hors taxe, float)
    - unit (unité: u, m2, ml, h, ens...)
    - category (catégorie si identifiable, sinon "Général")

    Format de réponse JSON strict :
    {
        "items": [
            {"label": "Peinture blanche", "price_ht": 15.0, "unit": "m2", "category": "Peinture"},
            ...
        ]
    }
    
    Texte à analyser :
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text_content[:10000]} # Limit context window
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
