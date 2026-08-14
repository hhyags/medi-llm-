import asyncio
import sys
from app.db.session import SessionLocal
from app.db.models import Appointment
from app.llm.enhanced_provider import LLMProviderFactory
from app.config import Settings
from app.orchestrator.orchestrator import AIOrchestrator

# Set UTF-8 output encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    db = SessionLocal()
    settings = Settings()
    llm = LLMProviderFactory.create_provider('ollama', settings)
    orch = AIOrchestrator(llm)

    print("--- Turn 1 ---")
    res1 = await orch.process_chat(db, "I need a skin doctor tomorrow.", session_id="test1")
    print("Response 1:\n", res1["response"])

    print("\n--- Turn 2 ---")
    res2 = await orch.process_chat(db, "10:30 AM", session_id="test1")
    print("Response 2:\n", res2["response"])

    print("\n--- Turn 3 ---")
    res3 = await orch.process_chat(db, "Goutham, 9876543210", session_id="test1")
    print("Response 3:\n", res3["response"])

    print("\n--- Database Verification ---")
    appt = db.query(Appointment).filter(Appointment.patient_phone == "9876543210").order_by(Appointment.created_at.desc()).first()
    if appt:
        print(f"VERIFIED IN DB: ID={appt.id}, Patient={appt.patient_name}, Doctor={appt.doctor.name}, Date={appt.appointment_date}, Time={appt.appointment_time}, Status={appt.status}")
    else:
        print("No appointment found in DB!")

if __name__ == "__main__":
    asyncio.run(main())
