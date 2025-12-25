import os
from sqlmodel import SQLModel, create_engine, Session

# Check if running in production (Render/Neon)
database_url = os.getenv("DATABASE_URL")

if database_url:
    # Postgres (Fix Render URL format)
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(database_url)
else:
    # SQLite (Local)
    sqlite_file_name = "devis.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
