import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

print("Importing Client...")
try:
    from app.models.client import Client
    print("Client imported successfully.")
except Exception as e:
    print(f"Error importing Client: {e}")

print("Importing Devis...")
try:
    from app.models.devis import Devis
    print("Devis imported successfully.")
except Exception as e:
    print(f"Error importing Devis: {e}")

print("Importing Entreprise...")
try:
    from app.models.entreprise import Entreprise
    print("Entreprise imported successfully.")
except Exception as e:
    print(f"Error importing Entreprise: {e}")

print("Importing LLM models...")
try:
    from app.models.llm import LLMQuoteResponse
    print("LLM models imported successfully.")
except Exception as e:
    print(f"Error importing LLM models: {e}")

print("All imports finished.")
