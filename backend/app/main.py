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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Global Exception Handler (For Debugging Prod)
from fastapi import Request
from fastapi.responses import JSONResponse
@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": type(exc).__name__},
    )

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# EMERGENCY DB RESET (For Schema Updates)
@app.post("/admin/reset-db")
def reset_database(key: str):
    if key != "secure_reset_2024":
        return {"error": "Invalid key"}
    
    from sqlmodel import SQLModel
    from .db.database import engine
    
    # Drop all
    SQLModel.metadata.drop_all(engine)
    # Recreate all
    SQLModel.metadata.create_all(engine)
    
    return {"status": "Database Reset and Updated"}

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
