import json
import os
from openai import OpenAI
from ..models.devis import Devis
from ..models.llm import LLMQuoteResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Tu es un expert en devis BTP.
Ton objectif est de PRODUIRE UN DEVIS le plus rapidement possible.

Règles d'or :
1. Tu reçois les lignes actuelles du devis ET un catalogue de prix (si disponible) dans le contexte.
2. UTILISE PRIORITAIREMENT LE CATALOGUE DE PRIX pour fixer les prix unitaires. Si un article correspond, utilise son prix exact.
3. Pour toute modification, renvoie la LISTE COMPLÈTE et À JOUR de toutes les lignes.
4. Si l'utilisateur demande un devis, génère les lignes (action="update_quote").
5. Si l'utilisateur précise une TVA, applique-la. Sinon 20%.
6. Fais des estimations réalistes pour les prix manquants (hors catalogue).

Format de réponse JSON strict :
{
  "action": "update_quote" | "ask_clarification" | "just_chat",
  "lines": [
    {
      "label": "Désignation",
      "quantity": 1.0,
      "unit": "u",
      "unit_price_ht": 50.0,
      "tva_rate": 0.2,
      "lot": "Lot",
      "note": ""
    }
  ],
  "detailed_description": "...",
  "assistant_message": "...",
  "questions_for_user": []
}
"""

def propose_quote_update(
    message_user: str,
    devis: Devis,
    include_detailed_description: bool = False,
    price_list: list[dict] = None,
    image_base64: str = None
) -> LLMQuoteResponse:
    
    # Context construction
    context_data = {
        "current_quote_lines": [l.dict() for l in devis.lignes],
        "price_list_catalog": price_list or [],
        "user_message": message_user,
        "include_detailed_description": include_detailed_description
    }

    user_content = json.dumps(context_data, default=str)
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if image_base64:
        # Multimodal message
        messages.append({
            "role": "user", 
            "content": [
                {
                    "type": "text", 
                    "text": f"Voici le contexte JSON (dont ma demande) : {user_content}. ANALYSE L'IMAGE FOURNIE pour extraire les travaux à faire."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        })
    else:
        # Standard text message
        messages.append({"role": "user", "content": user_content})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # or gpt-3.5-turbo
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        content = response.choices[0].message.content
        print(f"LLM RAW RESPONSE: {content}") # Debug log
        
        if not content:
            raise ValueError("Empty response from LLM")
            
        data = json.loads(content)
        return LLMQuoteResponse(**data)
        
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback response
        return LLMQuoteResponse(
            action="just_chat",
            assistant_message="Désolé, j'ai eu un problème technique. Peux-tu reformuler ?",
            lines=[]
        )
