from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import create_db_and_tables
from fastapi.staticfiles import StaticFiles
from .routers import chat, devis, entreprise, clients, upload, feedback, pricelist

# Initialization of the app
app = FastAPI(title="IA Devis API (Refactored)") # Reload trigger

# CORS Configuration
# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://devis-ai-azure.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://devis-ai.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

# Include Routers
app.include_router(chat.router)
app.include_router(devis.router)
app.include_router(entreprise.router)
app.include_router(clients.router)
app.include_router(upload.router)
app.include_router(feedback.router)
app.include_router(pricelist.router)
