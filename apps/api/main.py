import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.llm.enhanced_provider import LLMProviderFactory
from app.config import Settings
from app.db.session import get_db, engine, Base
from app.db.seed import seed_database
from app.routers import hospital, appointments, rag_router
from app.orchestrator.orchestrator import AIOrchestrator

app = FastAPI(title="MedVoice AI API — Phase 3 Medical RAG & Receptionist", version="0.3.0")

# Load settings
settings = Settings()

# Initialize Database & Seed
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Database seed note: {e}")

# Initialize LLM provider & AI Orchestrator
llm_provider = LLMProviderFactory.create_provider(settings.llm_provider, settings)
orchestrator = AIOrchestrator(llm_provider)

# Include Routers
app.include_router(hospital.router)
app.include_router(appointments.router)
app.include_router(rag_router.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MedVoice AI Phase 3",
        "llm_provider": settings.llm_provider
    }


@app.post("/chat")
async def chat_endpoint(payload: dict, db: Session = Depends(get_db)):
    """AI Receptionist & Medical RAG Chat endpoint."""
    user_message = payload.get("message", "")
    session_id = payload.get("session_id", "default_session")

    if not user_message:
        return {"error": "No message provided"}

    # Process through AI Receptionist & RAG Orchestrator
    result = await orchestrator.process_chat(db=db, message=user_message, session_id=session_id)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)