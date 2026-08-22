import sys
import asyncio
from pathlib import Path

# Add project root and apps/api to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_ROOT = PROJECT_ROOT / "apps" / "api"
sys.path.insert(0, str(API_ROOT))
sys.path.insert(0, str(PROJECT_ROOT))

from app.db.session import SessionLocal, engine, Base
from app.db.seed import seed_database
from app.services.appointment_service import AppointmentService
from app.services.sarvam_caller import sarvam_caller

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception:
        pass

    # 1. Book Appointment
    print("Booking appointment for 9390285197...")
    booking_res = AppointmentService.book_appointment(
        db=db,
        patient_name="Patient",
        patient_phone="9390285197",
        doctor_id_or_name="Dr. Priya Sharma",
        date_str="tomorrow",
        time_slot="10:30 AM"
    )
    print("Booking Response:", booking_res)

    # 2. Trigger Sarvam AI Outbound Call
    async def place_call():
        appt = booking_res.get("appointment", {})
        payload = sarvam_caller.build_payload(
            user_phone_number="+919390285197",
            user_name="Patient",
            service_provider_name=appt.get("doctor_name", "Dr. Priya Sharma"),
            service_type="Dermatology Consultation",
            existing_appointment_date_time=f"{appt.get('date', 'Tomorrow')} at {appt.get('time_slot', '10:30 AM')}",
            service_location="MedVoice City Hospital",
            service_location_address="123 Healthcare Boulevard, Medical District",
            customer_care_number="+1 (800) 555-MEDS"
        )
        print("Dispatching Sarvam call to +919390285197...")
        res = await sarvam_caller.trigger_outbound_call(payload)
        print("Sarvam Call Result:", res)
        return res

    call_result = asyncio.run(place_call())
    db.close()
    return booking_res, call_result

if __name__ == "__main__":
    main()
