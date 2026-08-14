import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, Base, SessionLocal
from app.db.models import HospitalInfo, Department, Doctor, DoctorSchedule, Patient, Appointment

def seed_database(db: Session = None):
    """Seed initial data into the database."""
    close_session = False
    if db is None:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_session = True

    try:
        # Check if already seeded
        if db.query(HospitalInfo).first():
            return

        # 1. Hospital Info
        hospital = HospitalInfo(
            name="MedVoice City Hospital",
            address="123 Healthcare Boulevard, Medical District, Metro City",
            phone="+1 (800) 555-MEDS",
            emergency_contact="+1 (800) 555-9111 or dial 911",
            operating_hours="Emergency & Inpatient: 24/7 | Outpatient OPD: Mon-Sat 08:00 AM - 08:00 PM",
            description="Leading multi-specialty tertiary care hospital offering comprehensive healthcare services."
        )
        db.add(hospital)

        # 2. Departments
        depts_data = [
            {"name": "Cardiology", "code": "CARD", "description": "Comprehensive heart and cardiovascular care", "location": "Block A, 2nd Floor"},
            {"name": "Dermatology", "code": "DERM", "description": "Skin, hair, and nail health services", "location": "Block B, 1st Floor"},
            {"name": "Orthopedics", "code": "ORTHO", "description": "Bone, joint, and musculoskeletal treatments", "location": "Block C, Ground Floor"},
            {"name": "Pediatrics", "code": "PED", "description": "Specialized healthcare for infants, children, and teens", "location": "Block D, 3rd Floor"},
            {"name": "General Medicine", "code": "GENMED", "description": "Primary care and internal medicine consultations", "location": "Main Block, 1st Floor"},
            {"name": "Neurology", "code": "NEURO", "description": "Brain, nerve, and spinal cord care", "location": "Block E, 2nd Floor"},
        ]
        
        dept_map = {}
        for d in depts_data:
            dept = Department(**d)
            db.add(dept)
            db.flush()
            dept_map[dept.name] = dept.id

        # 3. Doctors
        doctors_data = [
            {
                "name": "Dr. Priya Sharma",
                "department_id": dept_map["Dermatology"],
                "specialization": "Dermatologist & Cosmetic Specialist",
                "consultation_fee": 600.0,
                "experience_years": 8,
                "bio": "Expert in clinical dermatology, skin conditions, acne, and allergy management.",
                "working_days": "Monday to Saturday",
                "working_hours": "09:00 AM - 04:00 PM"
            },
            {
                "name": "Dr. Rajesh Kumar",
                "department_id": dept_map["Cardiology"],
                "specialization": "Interventional Cardiologist",
                "consultation_fee": 1000.0,
                "experience_years": 15,
                "bio": "Specialist in heart disease prevention, angioplasty, and hypertension.",
                "working_days": "Monday to Friday",
                "working_hours": "09:30 AM - 05:00 PM"
            },
            {
                "name": "Dr. Ananya Sen",
                "department_id": dept_map["Pediatrics"],
                "specialization": "Pediatrician & Child Health",
                "consultation_fee": 500.0,
                "experience_years": 10,
                "bio": "Dedicated child specialist handling vaccinations, growth, and pediatric care.",
                "working_days": "Monday to Saturday",
                "working_hours": "09:00 AM - 03:00 PM"
            },
            {
                "name": "Dr. Vikram Verma",
                "department_id": dept_map["Orthopedics"],
                "specialization": "Orthopedic & Joint Surgeon",
                "consultation_fee": 800.0,
                "experience_years": 12,
                "bio": "Expert in joint replacement, sports injury recovery, and fracture care.",
                "working_days": "Monday to Saturday",
                "working_hours": "10:00 AM - 06:00 PM"
            },
            {
                "name": "Dr. Sneha Patel",
                "department_id": dept_map["General Medicine"],
                "specialization": "Internal Medicine Physician",
                "consultation_fee": 500.0,
                "experience_years": 7,
                "bio": "Primary care physician specializing in routine checkups, fever, and chronic illness.",
                "working_days": "Monday to Saturday",
                "working_hours": "08:00 AM - 04:00 PM"
            },
            {
                "name": "Dr. Rahul Deshmukh",
                "department_id": dept_map["Neurology"],
                "specialization": "Neurologist",
                "consultation_fee": 1200.0,
                "experience_years": 14,
                "bio": "Specialist in headache disorders, epilepsy, stroke recovery, and neuropathy.",
                "working_days": "Monday to Friday",
                "working_hours": "10:00 AM - 04:00 PM"
            }
        ]

        doctors_list = []
        for doc in doctors_data:
            d = Doctor(**doc)
            db.add(d)
            db.flush()
            doctors_list.append(d)

        # 4. Doctor Schedules for Next 14 Days
        today = datetime.date.today()
        default_slots = ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"]

        for doc in doctors_list:
            for day_offset in range(14):
                date_str = (today + datetime.timedelta(days=day_offset)).isoformat()
                schedule = DoctorSchedule(
                    doctor_id=doc.id,
                    date=date_str,
                    available_slots=list(default_slots)
                )
                db.add(schedule)

        # 5. Seed a sample patient and appointment for testing
        patient = Patient(name="Goutham", phone="9876543210", email="goutham@example.com")
        db.add(patient)
        db.flush()

        sample_appt = Appointment(
            id="APT-INIT01",
            patient_name="Goutham",
            patient_phone="9876543210",
            patient_id=patient.id,
            doctor_id=doctors_list[0].id, # Dr. Priya Sharma
            department_id=dept_map["Dermatology"],
            appointment_date=(today + datetime.timedelta(days=2)).isoformat(),
            appointment_time="10:30 AM",
            status="BOOKED"
        )
        db.add(sample_appt)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    seed_database()
    print("Database successfully created and seeded!")
