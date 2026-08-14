import os
import sys
import json
import hashlib
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def create_doc(rel_path: str, title: str, source: str, source_url: str, topic: str, category: str, language: str, text: str, format_type: str = "md"):
    file_path = KNOWLEDGE_DIR / f"{rel_path}.{format_type}"
    meta_path = KNOWLEDGE_DIR / f"{rel_path}.json"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    # Write document text
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    # Compute SHA-256 hash
    content_hash = compute_hash(text)

    # Write metadata sidecar
    doc_id = rel_path.replace("/", "-").replace("\\", "-")
    metadata = {
        "document_id": f"medvoice-{doc_id}",
        "title": title,
        "source": source,
        "source_url": source_url,
        "language": language,
        "topic": topic,
        "category": category,
        "trust_level": "authoritative",
        "version": "1.0",
        "format": format_type,
        "published_date": "2024-01-15",
        "last_reviewed": "2024-11-01",
        "expiry_date": None,
        "content_hash": content_hash
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

def main():
    print(f"Generating authoritative medical knowledge base in {KNOWLEDGE_DIR}...")

    # ================= CONDITIONS =================
    create_doc(
        "medical/conditions/diabetes_mellitus",
        "Diabetes Mellitus Clinical Practice Guidelines",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/diabetes",
        "diabetes", "condition", "en",
        """# Diabetes Mellitus: Clinical Overview & Management

## Overview & Classification
Diabetes mellitus is a chronic metabolic disorder characterized by elevated levels of blood glucose. It occurs when the pancreas does not produce enough insulin (Type 1 Diabetes) or when the body cannot effectively use the insulin it produces (Type 2 Diabetes). Over 95% of diabetes cases worldwide are Type 2 Diabetes.

## Common Symptoms & Early Indicators
The classic symptoms of diabetes include:
- Excessive thirst (polydipsia)
- Frequent urination (polyuria), particularly at night
- Constant extreme hunger (polyphagia)
- Unexplained weight loss
- Chronic fatigue and lethargy
- Blurred vision and slow-healing sores or recurrent skin infections

## Diagnostic Criteria & Blood Tests
- Fasting Blood Sugar (FBS): Normal is < 100 mg/dL. Fasting glucose >= 126 mg/dL indicates diabetes.
- Postprandial Blood Sugar (PPBS): Normal is < 140 mg/dL. A reading >= 200 mg/dL indicates diabetes.
- Hemoglobin A1c (HbA1c): Normal is < 5.7%. Pre-diabetes is 5.7% - 6.4%. Diabetes is diagnosed at >= 6.5%.

## Lifestyle & Preventive Guidelines
Management focuses on a balanced low-glycemic diet rich in whole grains and vegetables, at least 150 minutes of moderate aerobic exercise per week, weight control, and routine blood glucose monitoring."""
    )

    create_doc(
        "medical/conditions/hypertension",
        "Hypertension Guidelines and Cardiovascular Risk Management",
        "WHO / AHA",
        "https://www.who.int/news-room/fact-sheets/detail/hypertension",
        "hypertension", "condition", "en",
        """# Hypertension (High Blood Pressure) Guidelines

## Overview
Hypertension is a chronic medical condition in which the blood pressure in the arteries is persistently elevated. It is known as a 'silent killer' because it often presents with no symptoms until organ damage has occurred.

## Blood Pressure Classifications
- Normal: Systolic < 120 mmHg and Diastolic < 80 mmHg.
- Elevated BP: Systolic 120-129 mmHg and Diastolic < 80 mmHg.
- Stage 1 Hypertension: Systolic 130-139 mmHg or Diastolic 80-89 mmHg.
- Stage 2 Hypertension: Systolic >= 140 mmHg or Diastolic >= 90 mmHg.
- Hypertensive Crisis: Systolic > 180 mmHg and/or Diastolic > 120 mmHg (Requires immediate emergency intervention).

## Symptoms of High Blood Pressure
When blood pressure reaches dangerous levels, symptoms may include severe morning headaches, nosebleeds, irregular heart rhythms, vision changes, and dizziness.

## Prevention & Management
Dietary Approaches to Stop Hypertension (DASH diet), sodium reduction (<2000 mg/day), regular physical activity, stress management, and limiting alcohol."""
    )

    create_doc(
        "medical/conditions/asthma",
        "Asthma Management Guidelines",
        "GINA / MedlinePlus",
        "https://medlineplus.gov/asthma.html",
        "asthma", "condition", "en",
        """# Asthma: Clinical Overview & Management

## Overview
Asthma is a major non-communicable disease characterized by recurrent attacks of breathlessness and wheezing, which vary in severity and frequency from person to person.

## Common Symptoms
- Recurrent wheezing (a whistling sound during exhalation)
- Persistent shortness of breath and chest tightness
- Nighttime or early morning coughing
- Difficulty speaking in full sentences during exacerbations

## Trigger Factors
Common triggers include respiratory infections, cold air, air pollution, tobacco smoke, pet dander, dust mites, and exercise.

## Management & Preventive Inhalation
Asthma management involves identifying and avoiding triggers, using prescribed controller (anti-inflammatory) medications, and having a fast-acting rescue bronchodilator readily accessible."""
    )

    create_doc(
        "medical/conditions/heart_disease",
        "Coronary Artery Disease & Heart Health",
        "AHA / WHO",
        "https://www.who.int/health-topics/cardiovascular-diseases",
        "heart disease", "condition", "en",
        """# Coronary Artery Disease & Heart Health Guidelines

## Overview
Cardiovascular diseases (CVDs) are the leading cause of death globally. Coronary artery disease involves the narrowing or blockage of the coronary arteries, usually caused by atherosclerosis (plaque buildup).

## Warning Signs & Red Flags
- Chest pain or tightness (angina) radiating to jaw, neck, left arm, or back
- Shortness of breath during exertion
- Heart palpitations or irregular heartbeats
- Dizziness and unexplained fatigue

## Emergency Triage
If chest pain lasts more than 5 minutes or is accompanied by cold sweats and vomiting, call emergency services immediately."""
    )

    create_doc(
        "medical/conditions/stroke",
        "Acute Stroke Awareness and FAST Protocol",
        "CDC / WHO",
        "https://www.cdc.gov/stroke/signs-symptoms.htm",
        "stroke", "condition", "en",
        """# Stroke: Identification, Emergency FAST Protocol & Care

## Overview
A stroke occurs when the blood supply to part of the brain is interrupted or reduced, preventing brain tissue from getting oxygen and nutrients. Brain cells begin to die in minutes.

## The FAST Warning Protocol
- F (Face Drooping): Does one side of the face droop or is it numb? Smile test.
- A (Arm Weakness): Is one arm weak or numb? Raise both arms.
- S (Speech Difficulty): Is speech slurred or unable to speak?
- T (Time to Call Emergency): If any of these signs are present, call emergency services immediately.

## Risk Factors & Prevention
Control high blood pressure, manage diabetes, maintain healthy cholesterol levels, avoid smoking, and stay physically active."""
    )

    create_doc(
        "medical/conditions/anemia",
        "Anemia Diagnosis and Dietary Guidelines",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/anemia.html",
        "anemia", "condition", "en",
        """# Anemia Clinical Reference

## Overview
Anemia is a condition in which the blood has a lower than normal number of red blood cells or hemoglobin, reducing oxygen delivery to body tissues. Iron deficiency is the most common cause globally.

## Symptoms
- Persistent fatigue and lack of energy
- Pale or yellowish skin, brittle nails
- Cold hands and feet
- Dizziness, lightheadedness, and shortness of breath upon exertion

## Dietary Recommendations
Increase intake of iron-rich foods (spinach, lentils, red meat, fortified cereals) paired with Vitamin C (citrus fruits) to enhance iron absorption."""
    )

    create_doc(
        "medical/conditions/dengue",
        "Dengue Clinical Management and Warning Signs",
        "WHO / ICMR",
        "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
        "dengue", "condition", "en",
        """# Dengue Fever: Clinical Features & Management

## Overview
Dengue is a mosquito-borne viral infection caused by the dengue virus (DENV), transmitted through the bite of infected Aedes mosquitoes.

## Key Symptoms
- Sudden high fever (104°F / 40°C)
- Severe headache and retro-orbital (behind the eyes) pain
- Severe muscle and joint pains (breakbone fever)
- Nausea, vomiting, and skin rash

## Severe Dengue Warning Signs
Severe abdominal pain, persistent vomiting, bleeding from gums or nose, rapid breathing, and extreme lethargy.
Warning: Avoid NSAIDs (aspirin, ibuprofen) due to bleeding risk. Paracetamol and aggressive oral hydration are standard supportive care."""
    )

    create_doc(
        "medical/conditions/malaria",
        "Malaria Overview and Fever Cycle",
        "WHO / CDC",
        "https://www.cdc.gov/malaria/about/disease.html",
        "malaria", "condition", "en",
        """# Malaria Guidelines & Clinical Features

## Overview
Malaria is a life-threatening disease caused by Plasmodium parasites, transmitted to people through the bites of infected female Anopheles mosquitoes.

## Clinical Presentation
Cycles of intense shivering and chills followed by high fever and profuse sweating. Associated symptoms include headache, vomiting, diarrhea, and body aches.

## Diagnosis & Care
Diagnosed via rapid diagnostic tests (RDT) or peripheral blood smear microscopy. Early artemisinin-based combination therapy (ACT) is critical."""
    )

    create_doc(
        "medical/conditions/tuberculosis",
        "Tuberculosis (TB) Detection and Care",
        "WHO / ICMR",
        "https://www.who.int/news-room/fact-sheets/detail/tuberculosis",
        "tuberculosis", "condition", "en",
        """# Tuberculosis (TB) Management Guidelines

## Overview
Tuberculosis is an infectious disease caused by Mycobacterium tuberculosis that most often affects the lungs. It is spread through the air when people who have active pulmonary TB cough, sneeze, or spit.

## Warning Symptoms
- Coughing that lasts 3 or more weeks
- Coughing up blood or sputum
- Chest pain with breathing or coughing
- Unintentional weight loss, night sweats, and low-grade evening fever

## Treatment Compliance
TB is curable with a standard 6-month course of antimicrobial drugs (DOTS protocol). Strict medication adherence is vital to prevent multi-drug resistant TB (MDR-TB)."""
    )

    create_doc(
        "medical/conditions/pneumonia",
        "Pneumonia Respiratory Guidelines",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/pneumonia.html",
        "pneumonia", "condition", "en",
        """# Pneumonia: Symptoms and Care Guidelines

## Overview
Pneumonia is an acute respiratory infection that affects the lungs, causing alveoli to become filled with pus and fluid, making breathing painful and limiting oxygen intake.

## Symptoms
- Productive cough with yellow, green, or blood-tinged phlegm
- High fever, sweating, and shaking chills
- Shortness of breath and sharp chest pain that worsens with deep breathing
- Fatigue and confusion in elderly patients

## Medical Attention
Requires prompt clinical evaluation, pulse oximetry monitoring, chest X-ray, and appropriate antimicrobial or supportive therapy."""
    )

    create_doc(
        "medical/conditions/arthritis",
        "Arthritis and Joint Health Guidelines",
        "CDC / MedlinePlus",
        "https://medlineplus.gov/arthritis.html",
        "arthritis", "condition", "en",
        """# Arthritis: Types, Symptoms and Joint Care

## Overview
Arthritis refers to swelling and tenderness of one or more joints. The most common types are osteoarthritis (wear-and-tear cartilage breakdown) and rheumatoid arthritis (autoimmune joint lining inflammation).

## Symptoms
- Joint pain, stiffness, and swelling
- Decreased range of motion
- Morning joint stiffness lasting more than 30 minutes (characteristic of rheumatoid arthritis)

## Management
Low-impact exercise (swimming, cycling), physical therapy, maintaining healthy body weight, and anti-inflammatory management."""
    )

    create_doc(
        "medical/conditions/migraine",
        "Migraine and Headache Clinical Protocol",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/migraine.html",
        "migraine", "condition", "en",
        """# Migraine: Symptoms, Triggers and Management

## Overview
Migraine is a primary headache disorder characterized by recurrent attacks of moderate-to-severe throbbing headache, usually affecting one side of the head.

## Symptoms
- Severe pulsating or throbbing head pain
- Sensitivity to light (photophobia) and sound (phonophobia)
- Nausea and vomiting
- Aura phenomena (visual flashes, blind spots) prior to headache onset

## Trigger Avoidance
Common triggers include irregular sleep, skipped meals, stress, bright lights, sensory overload, and specific food items like aged cheese or excessive caffeine."""
    )

    create_doc(
        "medical/conditions/epilepsy",
        "Epilepsy and Seizure Safety Protocols",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/epilepsy",
        "epilepsy", "condition", "en",
        """# Epilepsy: Seizure First Aid & Care

## Overview
Epilepsy is a chronic non-communicable disease of the brain that affects people of all ages, characterized by recurrent, unprovoked seizures.

## Seizure First Aid Rules
- Stay calm and cushion the person's head.
- Gently roll the person onto their side (recovery position) to keep the airway clear.
- Loosen tight clothing around the neck.
- DO NOT put anything into the person's mouth or attempt to hold their tongue.
- DO NOT physically restrain the person during convulsion.
- Call emergency services if the seizure lasts longer than 5 minutes or repeats."""
    )

    create_doc(
        "medical/conditions/kidney_disease",
        "Chronic Kidney Disease (CKD) Overview",
        "NKF / WHO",
        "https://www.kidney.org/atoz/content/about-chronic-kidney-disease",
        "kidney disease", "condition", "en",
        """# Chronic Kidney Disease (CKD) Guidelines

## Overview
Chronic kidney disease means your kidneys are damaged and losing their ability to filter waste and extra fluid from your blood. Diabetes and high blood pressure are the two leading causes.

## Early Warning Signs
- Swelling in the ankles, feet, or face (edema)
- Changes in urination frequency, foamy urine
- Fatigue, difficulty concentrating
- Persistent itching, muscle cramps at night

## Monitoring Tests
Annual Serum Creatinine, eGFR (estimated Glomerular Filtration Rate), and Urine Albumin-to-Creatinine Ratio (uACR)."""
    )

    create_doc(
        "medical/conditions/liver_disease",
        "Liver Health and Fatty Liver Management",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/liverdiseases.html",
        "liver disease", "condition", "en",
        """# Liver Disease & Fatty Liver Clinical Reference

## Overview
Liver disease covers a range of conditions including non-alcoholic fatty liver disease (NAFLD), hepatitis, and cirrhosis.

## Symptoms
- Jaundice (yellowing of skin and whites of eyes)
- Abdominal pain and swelling (ascites)
- Dark urine and pale stool
- Chronic fatigue and nausea

## Protective Measures
Limit alcohol consumption, maintain healthy body mass index, avoid sharing personal hygiene items, and get vaccinated for Hepatitis A and B."""
    )

    create_doc(
        "medical/conditions/obesity",
        "Obesity and Metabolic Health Guidelines",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight",
        "obesity", "condition", "en",
        """# Obesity and Metabolic Health Guidelines

## Overview
Overweight and obesity are defined as abnormal or excessive fat accumulation that presents a risk to health. A Body Mass Index (BMI) >= 25 is overweight, and >= 30 is obese.

## Health Implications
Increases the risk of type 2 diabetes, coronary artery disease, osteoarthritis, hypertension, and sleep apnea.

## Lifestyle Interventions
Gradual caloric reduction, prioritizing nutrient-dense whole foods, 150-300 minutes of weekly moderate aerobic activity, and behavioral lifestyle support."""
    )

    # ================= SYMPTOMS =================
    create_doc(
        "medical/symptoms/fever",
        "Fever Evaluation and Home Care Protocols",
        "CDC / MedlinePlus",
        "https://medlineplus.gov/fever.html",
        "fever", "symptom", "en",
        """# Fever: Causes, Measurement & Safe Management

## Overview
A fever is a temporary increase in body temperature, often due to an illness. Normal body temperature is around 98.6°F (37°C). A fever is generally considered a body temperature of 100.4°F (38°C) or higher.

## Home Care & Hydration
- Drink plenty of fluids (water, clear broths, oral rehydration solutions).
- Rest in a comfortably cool environment.
- Use lightweight clothing and light blankets.
- Lukewarm sponge baths can help lower body temperature safely.

## Emergency Warning Signs
Seek urgent medical attention if fever exceeds 103°F (39.4°C), lasts more than 3 consecutive days, or is accompanied by stiff neck, confusion, difficulty breathing, or severe persistent vomiting.""",
        format_type="txt"
    )

    create_doc(
        "medical/symptoms/cough",
        "Cough Symptom Guide and Red Flags",
        "MedlinePlus / CDC",
        "https://medlineplus.gov/cough.html",
        "cough", "symptom", "en",
        """# Cough: Types, Causes and Clinical Evaluation

## Overview
A cough is a natural reflex that protects your airway and lungs against irritants. Acute coughs last less than 3 weeks; chronic coughs persist for 8 weeks or longer.

## Common Causes
- Viral upper respiratory infections (common cold, flu)
- Allergic rhinitis and post-nasal drip
- Asthma and gastroesophageal reflux disease (GERD)
- Bacterial bronchitis or pneumonia

## Warning Signs
Coughing up blood (hemoptysis), high fever, severe shortness of breath, unexplained weight loss, or night sweats."""
    )

    create_doc(
        "medical/symptoms/headache",
        "Headache Symptom Triage",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/headache.html",
        "headache", "symptom", "en",
        """# Headache: Assessment & Red Flag Triage

## Common Types
- Tension Headaches: Constant dull ache affecting both sides of the head.
- Migraines: Intense throbbing headache, often with nausea and photophobia.
- Cluster Headaches: Severe burning pain around one eye.

## 'Thunderclap' Emergency Alert
A sudden, excruciating headache reaching peak intensity within seconds ('worst headache of life') requires immediate emergency evaluation for subarachnoid hemorrhage."""
    )

    create_doc(
        "medical/symptoms/chest_pain",
        "Chest Pain Triage Protocol",
        "AHA / MedlinePlus",
        "https://medlineplus.gov/chestpain.html",
        "chest pain", "symptom", "en",
        """# Chest Pain: Triage and Differential Evaluation

## Critical Safety Warning
All acute, unexplained chest pain must be treated as a potential cardiac emergency until evaluated by qualified medical professionals.

## Cardiac vs Non-Cardiac Indicators
- Cardiac: Crushing, squeezing substernal pressure radiating to neck, jaw, shoulders, or arms; associated with diaphoresis, dyspnea, nausea.
- Non-Cardiac: Sharp pleuritic pain worsening with deep breathing (pleurisy), burning retrosternal pain relieved by antacids (GERD), localized wall tenderness (costochondritis).

## Action Plan
Dial emergency services (911 / 108 / +1-800-555-9111) immediately for suspected acute coronary syndromes."""
    )

    create_doc(
        "medical/symptoms/abdominal_pain",
        "Abdominal Pain Clinical Evaluation",
        "MedlinePlus",
        "https://medlineplus.gov/abdominalpain.html",
        "abdominal pain", "symptom", "en",
        """# Abdominal Pain: Location and Red Flags

## Diagnostic Clues by Quadrant
- Right Lower Quadrant: Acute appendicitis (pain migrating from umbilicus to McBurney's point).
- Right Upper Quadrant: Gallbladder disease (cholecystitis), especially after fatty meals.
- Epigastric Pain: Gastritis, peptic ulcer, or acute pancreatitis.
- Left Lower Quadrant: Diverticulitis.

## Red Flags
Rigid abdomen, high fever, inability to keep fluids down, blood in vomit or stool, sudden severe worsening."""
    )

    create_doc(
        "medical/symptoms/dizziness",
        "Dizziness and Vertigo Symptom Reference",
        "MedlinePlus",
        "https://medlineplus.gov/dizzinessandvertigo.html",
        "dizziness", "symptom", "en",
        """# Dizziness, Lightheadedness and Vertigo

## Distinctions
- Vertigo: A false sensation of spinning movement, often caused by inner ear disorders (BPPV, labyrinthitis).
- Lightheadedness: Feeling faint or woozy, frequently caused by dehydration, orthostatic hypotension, or blood sugar drops.
- Disequilibrium: Feeling off-balance or unsteady on your feet.

## Precautions
Sit or lie down immediately to avoid fall injuries. Stay hydrated and avoid sudden postural changes."""
    )

    create_doc(
        "medical/symptoms/vomiting",
        "Vomiting and Nausea Care Protocol",
        "MedlinePlus / CDC",
        "https://medlineplus.gov/nauseaandvomiting.html",
        "vomiting", "symptom", "en",
        """# Nausea and Vomiting: Care and Hydration

## Primary Management
- Small, frequent sips of clear oral rehydration solution (ORS).
- Avoid solid foods until vomiting subsides for at least 4 hours.
- Reintroduce bland foods gradually (BRAT diet: bananas, rice, applesauce, toast).

## Danger Signs
Signs of severe dehydration (dry mouth, sunken eyes, no urine for 8 hours), vomiting blood (coffee-ground emesis), or severe abdominal rigidity."""
    )

    create_doc(
        "medical/symptoms/diarrhea",
        "Acute Diarrhea and Rehydration Guidelines",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
        "diarrhea", "symptom", "en",
        """# Diarrheal Disease & Oral Rehydration Therapy

## Overview
Diarrhea is defined as the passage of three or more loose or liquid stools per day. Dehydration is the primary life-threatening complication.

## WHO Oral Rehydration Solution (ORS)
ORS is a mixture of clean water, salt, and sugar absorbed in the small intestine, replacing water and essential electrolytes lost in diarrhea. Zinc supplementation shortens diarrhea duration in children.

## Red Flags
Blood or mucus in stool (dysentery), high persistent fever, or signs of severe dehydration."""
    )

    create_doc(
        "medical/symptoms/shortness_of_breath",
        "Dyspnea (Shortness of Breath) Evaluation",
        "MedlinePlus / ATS",
        "https://medlineplus.gov/breathingproblems.html",
        "shortness of breath", "symptom", "en",
        """# Shortness of Breath (Dyspnea) Clinical Guide

## Emergency Notice
Sudden onset shortness of breath is a medical emergency requiring immediate clinical attention.

## Common Causes
- Pulmonary: Asthma exacerbation, COPD, pneumonia, pulmonary embolism, pneumothorax.
- Cardiac: Congestive heart failure, acute myocardial infarction.
- Systemic: Severe anemia, panic attacks, metabolic acidosis.

## Action
Measure oxygen saturation via pulse oximeter. If SpO2 < 92% or patient is struggling to speak, initiate urgent emergency triage."""
    )

    create_doc(
        "medical/symptoms/fatigue",
        "Chronic Fatigue & Weakness Evaluation",
        "MedlinePlus",
        "https://medlineplus.gov/fatigue.html",
        "fatigue", "symptom", "en",
        """# Fatigue and Lethargy: Medical Assessment

## Overview
Fatigue is a feeling of constant tiredness or weakness that can be physical, mental, or a combination of both.

## Common Medical Causes
- Iron deficiency anemia, Vitamin D or B12 deficiency.
- Hypothyroidism, diabetes, chronic kidney disease.
- Sleep apnea, chronic stress, or depression.

## Recommended Workup
Complete Blood Count (CBC), Thyroid Profile (TSH), Fasting Blood Glucose, and Vitamin B12 / D levels."""
    )

    create_doc(
        "medical/symptoms/sore_throat",
        "Sore Throat (Pharyngitis) Assessment",
        "CDC / MedlinePlus",
        "https://medlineplus.gov/sorethroat.html",
        "sore throat", "symptom", "en",
        """# Sore Throat (Pharyngitis) Care & Management

## Causes
Most sore throats (over 85%) are caused by viral infections (common cold, flu) and do not require antibiotics. Group A Streptococcus (Strep throat) is a bacterial cause requiring antibiotic evaluation.

## Home Relief
- Warm salt-water gargles (1/2 tsp salt in warm water).
- Warm liquids (herbal tea with honey) and throat lozenges.
- Adequate hydration and rest.

## Warning Signs
Difficulty swallowing saliva, inability to open mouth fully (trismus), or difficulty breathing."""
    )

    create_doc(
        "medical/symptoms/rash",
        "Skin Rash and Dermatologic Triage",
        "MedlinePlus",
        "https://medlineplus.gov/rashes.html",
        "rash", "symptom", "en",
        """# Skin Rash: Identification & Red Flags

## Common Types
- Contact Dermatitis: Reaction to allergens or irritants (soaps, plants).
- Viral Exanthems: Rashes accompanying viral fevers (measles, rubella, dengue).
- Urticaria (Hives): Raised, itchy welts triggered by allergic reactions.

## Emergency Anaphylaxis Warning
If a rash/hives is accompanied by swelling of lips/tongue, difficulty breathing, or dizziness, administer epinephrine if available and call emergency services immediately."""
    )

    create_doc(
        "medical/symptoms/joint_pain",
        "Joint Pain (Arthralgia) Symptom Guide",
        "MedlinePlus",
        "https://medlineplus.gov/jointdisorders.html",
        "joint pain", "symptom", "en",
        """# Joint Pain (Arthralgia): Care & Assessment

## Overview
Joint pain can affect any joint in the body, caused by inflammation, cartilage wear, trauma, or infections.

## Self-Care (RICE Protocol for Minor Strain)
- Rest: Protect the joint from further strain.
- Ice: Apply cold packs for 15-20 minutes several times a day.
- Compression: Elastic wrap for mild support.
- Elevation: Elevate the joint above heart level when resting.

## Red Flags
Joint that is hot, visibly swollen, extremely red with fever (possible septic arthritis)."""
    )

    # ================= TESTS =================
    create_doc(
        "medical/tests/cbc",
        "Complete Blood Count (CBC) Diagnostic Guide",
        "MedlinePlus / CDC",
        "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/",
        "cbc", "test", "en",
        """# Complete Blood Count (CBC) Reference

## Purpose
A Complete Blood Count evaluates your overall health and detects a wide range of disorders, including anemia, infection, and leukemia.

## Key Parameters
- Red Blood Cells (RBC) & Hemoglobin: Oxygen-carrying capacity. Low levels indicate anemia.
- White Blood Cells (WBC): Immune defense cells. High levels often indicate bacterial or viral infection.
- Platelets: Essential for blood clotting. Low platelets (<150,000/mcL) increase bleeding risk (seen in dengue)."""
    )

    create_doc(
        "medical/tests/blood_glucose",
        "Blood Glucose Testing Reference",
        "ADA / WHO",
        "https://medlineplus.gov/lab-tests/blood-glucose-test/",
        "blood glucose", "test", "en",
        """# Blood Glucose Testing Reference

## Test Types & Reference Ranges
- Fasting Blood Sugar (FBS): Requires 8-10 hours fasting. Normal: 70-99 mg/dL. Pre-diabetes: 100-125 mg/dL. Diabetes: >= 126 mg/dL.
- Postprandial Blood Sugar (PPBS): Measured 2 hours after a meal. Normal: < 140 mg/dL. Diabetes: >= 200 mg/dL.
- Random Blood Sugar (RBS): Normal: < 140 mg/dL."""
    )

    create_doc(
        "medical/tests/hba1c",
        "Hemoglobin A1c (HbA1c) Reference",
        "ADA / WHO",
        "https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/",
        "hba1c", "test", "en",
        """# Hemoglobin A1c (HbA1c) Test Reference

## Clinical Purpose
HbA1c measures the percentage of hemoglobin coated with glucose over the preceding 2 to 3 months (the average lifespan of a red blood cell).

## Interpretation
- Normal: Below 5.7%
- Pre-diabetes: 5.7% to 6.4%
- Diabetes: 6.5% or higher
Target for most non-pregnant adults with diabetes is generally under 7.0%."""
    )

    create_doc(
        "medical/tests/lipid_profile",
        "Lipid Profile Cholesterol Test Reference",
        "AHA / MedlinePlus",
        "https://medlineplus.gov/lab-tests/lipid-panel/",
        "lipid profile", "test", "en",
        """# Lipid Profile Panel Guidelines

## Purpose
Assesses cardiovascular risk by measuring blood fats (lipids).

## Normal Targets
- Total Cholesterol: Desirable < 200 mg/dL.
- LDL (Low-Density Lipoprotein, 'Bad' Cholesterol): Optimal < 100 mg/dL.
- HDL (High-Density Lipoprotein, 'Good' Cholesterol): Protective >= 50 mg/dL (women), >= 40 mg/dL (men).
- Triglycerides: Normal < 150 mg/dL."""
    )

    create_doc(
        "medical/tests/urine_test",
        "Urinalysis Test Reference",
        "MedlinePlus",
        "https://medlineplus.gov/lab-tests/urinalysis/",
        "urine test", "test", "en",
        """# Urinalysis (Urine Routine & Microscopy) Reference

## Clinical Use
Evaluates kidney function, detects urinary tract infections (UTIs), diabetes, and metabolic conditions.

## Key Markers
- Leukocyte esterase & Nitrites: Presence suggests bacterial UTI.
- Protein (Albumin): Presence may indicate kidney damage.
- Glucose: Indicates uncontrolled diabetes or renal glycosuria.
- Red Blood Cells: Microscopic hematuria requiring further clinical investigation."""
    )

    create_doc(
        "medical/tests/xray",
        "Diagnostic Radiography (X-Ray) Guide",
        "MedlinePlus / ACR",
        "https://medlineplus.gov/xrays.html",
        "xray", "test", "en",
        """# Diagnostic X-Ray Guidelines

## Overview
X-rays use electromagnetic radiation to create pictures of the inside of the body, particularly bones and dense structures.

## Common Applications
- Chest X-Ray: Diagnosing pneumonia, tuberculosis, heart enlargement, and pneumothorax.
- Bone X-Ray: Detecting fractures, dislocations, and joint degeneration."""
    )

    create_doc(
        "medical/tests/ct_scan",
        "Computed Tomography (CT Scan) Guide",
        "MedlinePlus / ACR",
        "https://medlineplus.gov/ctscans.html",
        "ct scan", "test", "en",
        """# Computed Tomography (CT Scan) Overview

## Purpose
A CT scan combines a series of X-ray images taken from different angles around the body to create cross-sectional 3D images of bones, blood vessels, and soft tissues.

## Applications
Evaluating internal head trauma, stroke, abdominal organ pathology, pulmonary embolism, and oncology staging."""
    )

    create_doc(
        "medical/tests/mri",
        "Magnetic Resonance Imaging (MRI) Guide",
        "MedlinePlus / ACR",
        "https://medlineplus.gov/mriscans.html",
        "mri", "test", "en",
        """# Magnetic Resonance Imaging (MRI) Overview

## Purpose
Uses strong magnetic fields and radio waves to generate detailed images of organs and soft tissues without ionizing radiation.

## Safety Precautions
Patients with ferromagnetic metallic implants, pacemakers, or certain aneurysm clips must be screened prior to entering the MRI suite."""
    )

    create_doc(
        "medical/tests/ultrasound",
        "Diagnostic Ultrasound (Sonography) Guide",
        "MedlinePlus",
        "https://medlineplus.gov/ultrasound.html",
        "ultrasound", "test", "en",
        """# Diagnostic Ultrasound (Sonography)

## Purpose
Uses high-frequency sound waves to view live images of soft tissues, organs, and blood flow (Doppler). It is completely non-invasive and uses zero radiation.

## Uses
Obstetric monitoring, abdominal organ assessment (liver, gallbladder stones, kidneys), pelvic scans, and echocardiograms."""
    )

    create_doc(
        "medical/tests/ecg",
        "Electrocardiogram (ECG / EKG) Guide",
        "AHA / MedlinePlus",
        "https://medlineplus.gov/lab-tests/electrocardiogram-ecg/",
        "ecg", "test", "en",
        """# Electrocardiogram (ECG / EKG) Reference

## Purpose
An ECG records the electrical signals from your heart to check for heart conditions, including arrhythmias, heart attacks, and conduction blocks.

## Indications
Chest pain, palpitations, shortness of breath, unexplained fainting (syncope), and pre-operative cardiac clearance."""
    )

    # ================= PROCEDURES =================
    create_doc(
        "medical/procedures/cpr_protocol",
        "Cardiopulmonary Resuscitation (CPR) Protocol",
        "AHA / Red Cross",
        "https://www.heart.org/en/cpr",
        "cpr", "procedure", "en",
        """# Hands-Only CPR Emergency Protocol

## Steps
1. Verify scene safety and check responsiveness.
2. Call emergency services (911 / 108 / +1-800-555-9111) and get an Automated External Defibrillator (AED).
3. Place hands in the center of the chest.
4. Push hard and fast in the center of the chest at a rate of 100 to 120 compressions per minute (to the beat of 'Stayin' Alive').
5. Allow full chest recoil between compressions."""
    )

    create_doc(
        "medical/procedures/wound_care",
        "Basic Wound Care and First Aid",
        "CDC / Red Cross",
        "https://www.cdc.gov/natural-disasters/safety/wound-care.html",
        "wound care", "procedure", "en",
        """# Basic Wound Care and First Aid

## Procedure
1. Wash hands thoroughly with soap and clean water.
2. Apply gentle, direct pressure with a clean cloth to stop bleeding.
3. Clean the wound under gentle running water.
4. Apply a thin layer of sterile petroleum jelly or antibiotic ointment.
5. Cover with a sterile bandage and replace daily."""
    )

    create_doc(
        "medical/procedures/nebulization",
        "Nebulization Procedure and Inhalation Care",
        "GINA / MedlinePlus",
        "https://medlineplus.gov/druginfo/meds/a607062.html",
        "nebulization", "procedure", "en",
        """# Nebulization Procedure Guidelines

## Overview
A nebulizer turns liquid medication into a fine mist so it can be inhaled directly into the lungs during acute asthma attacks or COPD flare-ups.

## Steps
1. Wash hands and assemble nebulizer cup, tubing, and mask/mouthpiece.
2. Add prescribed medication into cup.
3. Sit upright and breathe slowly and deeply through the mask for 10-15 minutes until medication is spent.
4. Clean and disinfect nebulizer parts after each use."""
    )

    # ================= PREVENTION & PATIENT EDUCATION =================
    create_doc(
        "medical/prevention/healthy_diet",
        "Healthy Diet and Nutrition Guidelines",
        "WHO / USDA",
        "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
        "healthy diet", "prevention", "en",
        """# WHO Healthy Diet Recommendations

## Principles
- Eat a variety of whole foods including legumes, whole grains, fruits, and vegetables (at least 400g or 5 portions of fruits/veg per day).
- Keep total fat intake under 30% of total energy intake, prioritizing unsaturated fats.
- Limit free sugars to less than 10% of total energy intake.
- Limit salt (sodium) intake to less than 5g per day (approx. 1 level teaspoon)."""
    )

    create_doc(
        "medical/prevention/exercise",
        "Physical Activity and Exercise Guidelines",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
        "exercise", "prevention", "en",
        """# Physical Activity Guidelines

## Recommended Activity
- Adults should perform at least 150-300 minutes of moderate-intensity aerobic physical activity per week (e.g. brisk walking, cycling, swimming).
- Muscle-strengthening activities involving major muscle groups on 2 or more days a week."""
    )

    create_doc(
        "medical/prevention/sleep",
        "Sleep Hygiene and Rest Guidelines",
        "CDC / Sleep Foundation",
        "https://www.cdc.gov/sleep/about/index.html",
        "sleep", "prevention", "en",
        """# Sleep Hygiene & Health Guidelines

## Key Guidelines
- Adults need 7 to 9 hours of quality sleep per night.
- Keep a consistent sleep schedule (same bedtime and wake-up time every day).
- Keep bedroom dark, quiet, and cool.
- Turn off electronic screens at least 30-60 minutes before bed."""
    )

    create_doc(
        "medical/prevention/hydration",
        "Hydration and Fluid Balance",
        "CDC / WHO",
        "https://www.cdc.gov/healthy-weight-growth/water-health/index.html",
        "hydration", "prevention", "en",
        """# Daily Hydration & Fluid Intake

## Recommendations
- Average adult daily fluid intake should be approximately 2.5 to 3.5 liters from water and healthy beverages.
- Plain water is the best choice for hydration with zero calories and no added sugars.
- Increase hydration during physical exertion, hot weather, or fever."""
    )

    create_doc(
        "medical/prevention/vaccination",
        "Vaccination and Immunization Guidelines",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/immunization-coverage",
        "vaccination", "prevention", "en",
        """# Immunization and Vaccine Protection

## Overview
Vaccines train the immune system to recognize and combat specific harmful pathogens.

## Key Immunizations
- Annual Influenza vaccine
- COVID-19 booster doses as recommended
- Hepatitis B, Tdap (Tetanus, Diphtheria, Pertussis) booster every 10 years
- Pneumococcal and Shingles vaccines for older adults."""
    )

    create_doc(
        "medical/prevention/hand_hygiene",
        "Hand Hygiene and Infection Prevention",
        "WHO / CDC",
        "https://www.who.int/campaigns/world-hand-hygiene-day",
        "hand hygiene", "prevention", "en",
        """# Hand Hygiene and Infection Prevention

## Proper Technique
1. Wet hands with clean running water.
2. Apply soap and lather thoroughly including backs of hands, between fingers, and under nails.
3. Scrub hands for at least 20 seconds.
4. Rinse well and dry with a clean towel or air dry.
5. If soap and water are unavailable, use alcohol-based hand rub with at least 60% alcohol."""
    )

    create_doc(
        "medical/prevention/preventive_care",
        "Annual Preventive Health Checkups",
        "USPSTF / WHO",
        "https://www.who.int/health-topics/primary-health-care",
        "preventive healthcare", "prevention", "en",
        """# Annual Preventive Healthcare Checklist

## Key Screenings
- Blood pressure check every 1-2 years.
- Fasting lipid and glucose panel every 3-5 years (or annually if high risk).
- Dental and vision screening annually.
- Age-appropriate cancer screenings (mammography, colorectal colonoscopy)."""
    )

    # ================= EMERGENCY =================
    create_doc(
        "emergency/acute_chest_pain_emergency",
        "Acute Cardiac Emergency Protocol",
        "AHA / WHO",
        "https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack",
        "chest pain", "emergency", "en",
        """# Acute Chest Pain Emergency Protocol

## Immediate Action
1. Call Hospital Emergency Services (+1-800-555-9111 or dial 911 / 108) immediately.
2. Have the patient rest comfortably in a semi-seated position.
3. Loosen tight clothing.
4. Do not leave the patient unattended.
5. Prepare for CPR if patient loses consciousness and stops normal breathing."""
    )

    # ================= PATIENT EDUCATION =================
    create_doc(
        "patient_education/lifestyle_management",
        "Comprehensive Chronic Disease Lifestyle Management",
        "WHO / MedlinePlus",
        "https://medlineplus.gov/howtopreventhighbloodpressure.html",
        "chronic care", "patient_education", "en",
        """# Chronic Disease Lifestyle Management

## Core Pillars
1. Nutrition: Whole-food Mediterranean or DASH eating pattern.
2. Activity: 150 minutes of physical activity weekly.
3. Medication Adherence: Take prescribed medications consistently at scheduled times.
4. Stress Reduction: Mindfulness, deep breathing, and restorative sleep."""
    )

    # ================= MULTILINGUAL (EN, HI, TE) =================
    create_doc(
        "multilingual/en/diabetes_summary",
        "Diabetes Mellitus English Summary",
        "WHO / CDC",
        "https://www.who.int/news-room/fact-sheets/detail/diabetes",
        "diabetes", "condition", "en",
        """# Diabetes Mellitus Summary
Diabetes is a metabolic condition marked by elevated blood glucose. Symptoms include excessive thirst (polydipsia), frequent urination (polyuria), weight loss, and fatigue. Fasting blood sugar >= 126 mg/dL or HbA1c >= 6.5% confirms diagnosis. Managed with diet, exercise, and clinical guidance."""
    )

    create_doc(
        "multilingual/hi/diabetes_hindi",
        "मधुमेह (Diabetes) संपूर्ण मार्गदर्शिका",
        "WHO / ICMR",
        "https://www.who.int/hi/news-room/fact-sheets/detail/diabetes",
        "diabetes", "condition", "hi",
        """# मधुमेह (Diabetes Mellitus): लक्षण, निदान और देखभाल

## अवलोकन
मधुमेह एक पुरानी बीमारी है जिसमें रक्त में ग्लूकोज (शर्करा) का स्तर सामान्य से अधिक हो जाता है। यह तब होता है जब अग्न्याशय पर्याप्त इंसुलिन नहीं बनाता है या शरीर इंसुलिन का ठीक से उपयोग नहीं कर पाता है।

## मुख्य लक्षण
- अत्यधिक प्यास लगना (Polydipsia)
- बार-बार पेशाब आना (Polyuria), विशेष रूप से रात में
- अत्यधिक भूख लगना और बिना वजह वजन कम होना
- लगातार थकान और कमजोरी महसूस होना
- घाव भरने में अधिक समय लगना या त्वचा में बार-बार संक्रमण

## जांच और सामान्य सीमा
- खाली पेट रक्त शर्करा (Fasting Blood Sugar): 126 mg/dL या अधिक मधुमेह का संकेत है।
- HbA1c टेस्ट: 6.5% या उससे अधिक मधुमेह दर्शाता है।

## रोकथाम और जीवनशैली
कम मीठा और फाइबर युक्त आहार, प्रतिदिन 30 मिनट का व्यायाम और वजन पर नियंत्रण रखना आवश्यक है।"""
    )

    create_doc(
        "multilingual/te/diabetes_telugu",
        "చక్కెర వ్యాధి (Diabetes) సమగ్ర సమాచారం",
        "WHO / ICMR",
        "https://www.who.int/news-room/fact-sheets/detail/diabetes",
        "diabetes", "condition", "te",
        """# చక్కెర వ్యాధి (Diabetes Mellitus): లక్షణాలు మరియు జాగ్రత్తలు

## అవలోకనం
రక్తంలో చక్కెర (గ్లూకోజ్) స్థాయిలు అధికంగా పెరిగినప్పుడు మధుమేహం లేదా చక్కెర వ్యాధి వస్తుంది. క్లోమగ్రంథి సరిగ్గా ఇన్సులిన్ ఉత్పత్తి చేయనప్పుడు లేదా శరీరం ఇన్సులిన్‌ను సరిగ్గా ఉపయోగించుకోలేనప్పుడు ఇది సంభవిస్తుంది.

## ముఖ్య లక్షణాలు
- విపరీతమైన దాహం వేయడం (Polydipsia)
- తరచుగా మూత్రవిసర్జన కావడం (ముఖ్యంగా రాత్రి వేళల్లో - Polyuria)
- అకస్మాత్తుగా బరువు తగ్గడం మరియు నిరంతర అలసట
- ఆకలి ఎక్కువగా ఉండటం
- గాయాలు త్వరగా మానకపోవడం

## రక్త పరీక్షలు
- ఫాస్టింగ్ బ్లడ్ షుగర్ (FBS): 126 mg/dL లేదా అంతకంటే ఎక్కువ ఉంటే మధుమేహం.
- HbA1c పరీక్ష: 6.5% లేదా అంతకంటే ఎక్కువ.

## నియంత్రణ పద్ధతులు
ఆరోగ్యకరమైన పోషకాహారం, ప్రతిరోజూ కనీసం 30 నిమిషాల వ్యాయామం, క్రమంతప్పకుండా వైద్యుడిని సంప్రదించడం."""
    )

    create_doc(
        "multilingual/hi/hypertension_hindi",
        "उच्च रक्तचाप (Hypertension) मार्गदर्शिका",
        "WHO / ICMR",
        "https://www.who.int/hi/news-room/fact-sheets/detail/hypertension",
        "hypertension", "condition", "hi",
        """# उच्च रक्तचाप (Hypertension): लक्षण व सावधानियां

## अवलोकन
उच्च रक्तचाप एक ऐसी स्थिति है जिसमें धमनियों में रक्त का दबाव लगातार अधिक रहता है। 140/90 mmHg या अधिक रक्तचाप को उच्च माना जाता है।

## लक्षण
अक्सर कोई लक्षण नहीं होते (साइलेंट किलर), लेकिन गंभीर स्थिति में सिरदर्द, चक्कर आना और दृष्टि धुंधली होना हो सकता है।

## नियंत्रण
नमक की मात्रा कम करें, नियमित व्यायाम करें और तनाव से बचें।"""
    )

    create_doc(
        "multilingual/te/hypertension_telugu",
        "రక్తపోటు (Hypertension) జాగ్రత్తలు",
        "WHO / ICMR",
        "https://www.who.int/news-room/fact-sheets/detail/hypertension",
        "hypertension", "condition", "te",
        """# అధిక రక్తపోటు (Hypertension): జాగ్రత్తలు

## వివరాలు
ధమనులలో రక్తం యొక్క ఒత్తిడి సాధారణ స్థాయి కంటే ఎక్కువగా ఉండటాన్ని హైపర్‌టెన్షన్ అంటారు. సాధారణ రక్తపోటు 120/80 mmHg. 140/90 కంటే ఎక్కువ ఉంటే అధిక రక్తపోటుగా పరిగణిస్తారు.

## నియంత్రణ మార్గాలు
ఉప్పు తక్కువగా తీసుకోవడం, క్రమం తప్పకుండా నడవడం, ఒత్తిడి తగ్గించుకోవడం."""
    )

    # ================= METADATA CATALOGUE =================
    catalog = []
    for root, dirs, files in os.walk(KNOWLEDGE_DIR):
        for file in files:
            if file.endswith(".json") and not file.endswith("catalog.json"):
                with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                    catalog.append(json.load(f))

    catalog_path = KNOWLEDGE_DIR / "metadata" / "catalog.json"
    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump({"total_documents": len(catalog), "documents": catalog}, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {len(catalog)} medical documents with metadata & SHA256 hashes.")

if __name__ == "__main__":
    main()
