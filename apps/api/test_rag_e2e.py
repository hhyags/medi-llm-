import asyncio
import sys
from app.db.session import SessionLocal
from app.llm.enhanced_provider import LLMProviderFactory
from app.config import Settings
from app.orchestrator.orchestrator import AIOrchestrator

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    db = SessionLocal()
    settings = Settings()
    llm = LLMProviderFactory.create_provider('ollama', settings)
    orch = AIOrchestrator(llm)

    print("==================================================")
    print("TEST 1: Medical RAG Question (Diabetes Symptoms)")
    print("==================================================")
    res1 = await orch.process_chat(db, "What are common symptoms of diabetes?", session_id="rag_test1")
    print("Action Taken:", res1.get("action_taken"))
    print("Grounded:", res1.get("grounded"))
    print("Citations:", res1.get("citations"))
    print("Response:\n", res1["response"])

    print("\n==================================================")
    print("TEST 2: Multilingual Query (Hindi Diabetes Symptoms)")
    print("==================================================")
    res2 = await orch.process_chat(db, "मधुमेह के लक्षण क्या हैं", session_id="rag_test2")
    print("Action Taken:", res2.get("action_taken"))
    print("Grounded:", res2.get("grounded"))
    print("Citations:", res2.get("citations"))
    print("Response:\n", res2["response"])

    print("\n==================================================")
    print("TEST 3: Out-of-Scope / Low Confidence Query")
    print("==================================================")
    res3 = await orch.process_chat(db, "How to build a rocket engine?", session_id="rag_test3")
    print("Action Taken:", res3.get("action_taken"))
    print("Grounded:", res3.get("grounded"))
    print("Response:\n", res3["response"])

    print("\n==================================================")
    print("TEST 4: Emergency Priority Override")
    print("==================================================")
    res4 = await orch.process_chat(db, "I have severe chest pain and short of breath!", session_id="rag_test4")
    print("Action Taken:", res4.get("action_taken"))
    print("Response:\n", res4["response"])

    print("\n==================================================")
    print("TEST 5: Phase 2 Hospital Tool Routing (Cardiology Hours)")
    print("==================================================")
    res5 = await orch.process_chat(db, "What are your hospital working hours?", session_id="rag_test5")
    print("Action Taken:", res5.get("action_taken"))
    print("Response:\n", res5["response"])

if __name__ == "__main__":
    asyncio.run(main())
