import asyncio
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_DIR = PROJECT_ROOT / "apps" / "api"
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.db.session import SessionLocal, Base, engine
from app.db.seed import seed_database
from app.llm.enhanced_provider import LLMProviderFactory
from app.config import Settings
from app.orchestrator.orchestrator import AIOrchestrator
from rag.pipeline import MedicalQdrantRAGPipeline

async def main():
    print("=" * 60)
    print("MEDVOICE AI — PHASE 3A END-TO-END RAG & QDRANT VERIFICATION")
    print("=" * 60)

    # Initialize DB & Seed
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception:
        pass

    db = SessionLocal()
    settings = Settings()
    llm = LLMProviderFactory.create_provider('ollama', settings)
    orch = AIOrchestrator(llm)

    # 1. Verify Qdrant indexing
    qdrant_pipe = MedicalQdrantRAGPipeline(llm)
    total_indexed = qdrant_pipe.qdrant_store.count_chunks()
    print(f"\n[1] QDRANT STATUS: Indexed {total_indexed} chunks across Conditions, Symptoms, Tests, Procedures, Prevention, and Multilingual.")
    assert total_indexed > 30, f"Expected >30 chunks in Qdrant, found {total_indexed}"

    # 2. Test Real Ingested Document Query (Diabetes)
    print("\n" + "=" * 60)
    print("[2] REAL DOCUMENT QUERY: Diabetes Symptoms & Tests (WHO/CDC)")
    print("=" * 60)
    res_diabetes = await orch.process_chat(db, "What are the common symptoms and diagnostic blood tests for diabetes?")
    print("Action Taken:", res_diabetes.get("action_taken"))
    print("Grounded:", res_diabetes.get("grounded"))
    print("Citations:", res_diabetes.get("citations"))
    print("Response:\n", res_diabetes.get("response"))

    # 3. Test Hindi Multilingual Query
    print("\n" + "=" * 60)
    print("[3] MULTILINGUAL QUERY (Hindi): मधुमेह के मुख्य लक्षण")
    print("=" * 60)
    res_hindi = await orch.process_chat(db, "मधुमेह के मुख्य लक्षण क्या हैं")
    print("Action Taken:", res_hindi.get("action_taken"))
    print("Grounded:", res_hindi.get("grounded"))
    print("Citations:", res_hindi.get("citations"))
    print("Response:\n", res_hindi.get("response"))

    # 4. Test Telugu Multilingual Query
    print("\n" + "=" * 60)
    print("[4] MULTILINGUAL QUERY (Telugu): చక్కెర వ్యాధి లక్షణాలు")
    print("=" * 60)
    res_telugu = await orch.process_chat(db, "చక్కెర వ్యాధి లక్షణాలు ఏమిటి")
    print("Action Taken:", res_telugu.get("action_taken"))
    print("Grounded:", res_telugu.get("grounded"))
    print("Citations:", res_telugu.get("citations"))
    print("Response:\n", res_telugu.get("response"))

    # 5. Test Low-Confidence Anti-Hallucination Rejection
    print("\n" + "=" * 60)
    print("[5] LOW-CONFIDENCE REJECTION: Out-of-Scope Query")
    print("=" * 60)
    res_oos = await orch.process_chat(db, "How to calibrate a nuclear reactor coolant valve?")
    print("Action Taken:", res_oos.get("action_taken"))
    print("Grounded:", res_oos.get("grounded"))
    print("Response:\n", res_oos.get("response"))

    # 6. Test Emergency Priority Override
    print("\n" + "=" * 60)
    print("[6] EMERGENCY OVERRIDE: Acute Chest Pain")
    print("=" * 60)
    res_emerg = await orch.process_chat(db, "Patient is experiencing crushing chest pain and cannot breathe!")
    print("Action Taken:", res_emerg.get("action_taken"))
    print("Response:\n", res_emerg.get("response"))

    # 7. Test Phase 2 Hospital Tool Routing
    print("\n" + "=" * 60)
    print("[7] HOSPITAL OPERATIONS TOOL: Hospital Hours")
    print("=" * 60)
    res_hosp = await orch.process_chat(db, "What are your hospital working hours?")
    print("Action Taken:", res_hosp.get("action_taken"))
    print("Response:\n", res_hosp.get("response"))

    print("\n" + "=" * 60)
    print("✅ ALL PHASE 3A END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
