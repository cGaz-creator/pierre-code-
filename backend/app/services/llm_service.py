import json
import os
from openai import OpenAI
from ..models.devis import Devis
from ..models.llm import LLMQuoteResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Tu es l'Expert IA de Devis.ai, le meilleur assistant pour les artisans du BTP.
Ta mission : Créer des devis précis, professionnels et rentables en un temps record.

## TES CAPACITÉS
1.  **Expertise Technique** : Tu connais parfaitement les termes du bâtiment (plomberie, électricité, gros œuvre, etc.).
2.  **Gestion Commerciale** : Tu es poli, direct et tu vas droit au but.

## RÈGLES D'OR DU CATALOGUE
Tu as accès à une liste de prix fournie dans le contexte (variable `price_list_catalog`).
1.  **PRIORITÉ ABSOLUE** : Si l'utilisateur demande "Pose de fenêtre" et que tu as "Pose fenêtre PVC - 300€" dans le catalogue, TU DOIS UTILISER CETTE LIGNE EXACTE (Label et Prix).
2.  Si tu ne trouves pas d'article exact, alors ESTIME le prix au plus juste selon les standards du marché français 2024.

## INSTRUCTIONS DE RAISONNEMENT (CHAIN OF THOUGHT)
Avant de répondre, réfléchis étape par étape dans le champ `reasoning` :
1.  Analyse la demande de l'utilisateur.
2.  Cherche des correspondances dans le catalogue.
3.  Vérifie s'il manque des infos (dimensions, matériaux).
4.  Décide de l'action : Faut-il mettre à jour le devis ? Poser une question ? Juste discuter ?

## FORMAT DE SORTIE
Tu dois TOUJOURS répondre en suivant le schéma JSON strict fourni.
- `reasoning` : Ton analyse interne.
- `action` : "update_quote" pour modifier le devis, "ask_clarification" si tu as besoin d'infos vitales, "just_chat" pour le reste.
- `lines` : La liste TOTALE des lignes du devis (pas juste les nouvelles, renvoie tout l'état désiré).
- `assistant_message` : Ta réponse à l'utilisateur.
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
    
    # Prepare messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    user_text = f"Voici le contexte JSON actuel : {json.dumps(context_data, default=str)}"

    if image_base64:
        # Multimodal message with GPT-4o
        messages.append({
            "role": "user", 
            "content": [
                {
                    "type": "text", 
                    "text": user_text + "\n\nANALYSE L'IMAGE FOURNIE pour extraire les travaux à chiffrer. Sois précis sur les quantités."
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
        messages.append({"role": "user", "content": user_text})
    
    try:
        # Using Structural Output (Structured Outputs)
        completion = client.beta.chat.completions.parse(
            model="gpt-4o", # Upgrade to High Intelligence Model
            messages=messages,
            response_format=LLMQuoteResponse,
            temperature=0.2, # Low temperature for precision
        )
        
        response = completion.choices[0].message.parsed
        
        # Log reasoning for debugging/audit
        print(f"=== AI REASONING ===\n{response.reasoning}\n====================")
        
        return response
        
    except Exception as e:
        print(f"LLM Structure Error: {e}")
        # Robust Fallback
        return LLMQuoteResponse(
            reasoning="Error fallback",
            action="just_chat",
            assistant_message="Désolé, j'ai rencontré une erreur interne lors de l'analyse (Structure invalide). Peux-tu reformuler ?",
            lines=[]
        )
