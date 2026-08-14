import asyncio
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db
from app.db.seed import seed_database
from app.rag.ingestion import DocumentIngestionService
from app.rag.vector_store import MedicalVectorStore
from app.rag.pipeline import MedicalRAGPipeline
from app.llm.enhanced_provider import BaseLLMProvider
from app.orchestrator.safety import SafetyChecker
from main import app

# Mock LLM provider for fast deterministic RAG unit testing
class MockLLMProvider(BaseLLMProvider):
    async def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        if "diabetes" in prompt.lower() or (system_prompt and "diabetes" in system_prompt.lower()):
            return "Diabetes mellitus is a metabolic condition where blood glucose levels are elevated due to insulin deficiency or resistance."
        if "hypertension" in prompt.lower() or (system_prompt and "hypertension" in system_prompt.lower()):
            return "Hypertension is defined as persistent blood pressure of 130/80 mmHg or higher."
        return "Grounded medical information."

    async def stream(self, prompt: str, **kwargs):
        yield "Grounded medical information."

    async def structured_output(self, prompt: str, schema: dict, **kwargs) -> dict:
        return {}

    async def health_check(self) -> bool:
        return True

TEST_DATABASE_URL = "sqlite:///./test_phase3.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    seed_database(db=TestingSessionLocal())
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()

# 1. Document Ingestion & Metadata Test
def test_document_ingestion():
    kb_dir = Path(__file__).resolve().parents[2] / "ai" / "knowledge_base"
    chunks = DocumentIngestionService.load_knowledge_base(kb_dir)
    assert len(chunks) >= 4
    first_chunk = chunks[0]
    assert first_chunk.title != ""
    assert first_chunk.source != ""
    assert first_chunk.authority != ""
    assert first_chunk.section != ""

# 2. Vector DB & Cosine Similarity Test
def test_vector_store_retrieval():
    kb_dir = Path(__file__).resolve().parents[2] / "ai" / "knowledge_base"
    chunks = DocumentIngestionService.load_knowledge_base(kb_dir)
    vs = MedicalVectorStore()
    vs.build_index(chunks)

    results = vs.search("What are symptoms of diabetes?", top_k=2)
    assert len(results) > 0
    top_chunk, score = results[0]
    assert "diabetes" in top_chunk.title.lower() or "diabetes" in top_chunk.condition.lower()
    assert score > 0.3

# 3. Multilingual Retrieval Test (Hindi & Spanish)
def test_multilingual_retrieval():
    kb_dir = Path(__file__).resolve().parents[2] / "ai" / "knowledge_base"
    chunks = DocumentIngestionService.load_knowledge_base(kb_dir)
    vs = MedicalVectorStore()
    vs.build_index(chunks)

    # Hindi query for diabetes symptoms
    hi_results = vs.search("मधुमेह के लक्षण क्या हैं", top_k=1)
    assert len(hi_results) > 0
    assert hi_results[0][1] > 0.25

    # Spanish query for hypertension symptoms
    es_results = vs.search("síntomas de la hipertensión", top_k=1)
    assert len(es_results) > 0
    assert es_results[0][1] > 0.25

# 4. Confidence Threshold & Fallback Test
def test_confidence_threshold():
    async def run():
        mock_llm = MockLLMProvider()
        kb_dir = Path(__file__).resolve().parents[2] / "ai" / "knowledge_base"
        pipeline = MedicalRAGPipeline(mock_llm, kb_dir=kb_dir)

        res = await pipeline.query("How to fix quantum physics computer code?", confidence_threshold=0.35)
        assert res["grounded"] is False
        assert "not have sufficient validated medical documentation" in res["response"]
    asyncio.run(run())

# 5. Source Grounding & Citation Display Test
def test_source_grounding_and_citations():
    async def run():
        mock_llm = MockLLMProvider()
        kb_dir = Path(__file__).resolve().parents[2] / "ai" / "knowledge_base"
        pipeline = MedicalRAGPipeline(mock_llm, kb_dir=kb_dir)

        res = await pipeline.query("What is diabetes?")
        assert res["grounded"] is True
        assert len(res["citations"]) > 0
        assert "Approved Medical References" in res["response"]
        assert "WHO" in res["response"] or "CDC" in res["response"] or "ICMR" in res["response"]
    asyncio.run(run())

# 6. Emergency Priority Test
def test_emergency_priority_override():
    is_emerg, msg = SafetyChecker.check_emergency("I have severe chest pain and cannot breathe!")
    assert is_emerg is True
    assert "MEDICAL EMERGENCY ALERT" in msg

# 7. Phase 1 & Phase 2 Regression Tests
def test_regression_phase1_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "MedVoice AI Phase 3"

def test_regression_phase2_hospital_and_appointments():
    # Hospital info
    resp_info = client.get("/api/hospital/info")
    assert resp_info.status_code == 200
    assert resp_info.json()["name"] == "MedVoice City Hospital"

    # Doctors list
    resp_docs = client.get("/api/hospital/doctors")
    assert resp_docs.status_code == 200
    assert len(resp_docs.json()["doctors"]) >= 6

    # Appointment booking API
    resp_book = client.post("/api/appointments/book", json={
        "patient_name": "Regression Test Patient",
        "patient_phone": "9991112223",
        "doctor_id_or_name": "Dr. Priya Sharma",
        "date": "tomorrow",
        "time_slot": "10:30 AM"
    })
    assert resp_book.status_code == 200
    assert resp_book.json()["success"] is True
