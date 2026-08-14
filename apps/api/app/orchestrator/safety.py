import re
from typing import Tuple, Optional

EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "severe bleeding", "bleeding heavily",
    "cannot breathe", "short of breath", "shortness of breath", "difficulty breathing",
    "stroke", "paralysis", "unconscious", "passed out", "seizure", "severe head injury",
    "poisoning", "suicide", "extreme trauma", "anaphylaxis", "choking"
]

DIAGNOSIS_REQUEST_KEYWORDS = [
    "diagnose me", "diagnose my", "diagnose if", "can you diagnose", "diagnose",
    "do i have", "what illness", "what disease",
    "what medication should i take", "prescribe me", "prescribe", "dosage"
]

class SafetyChecker:

    @staticmethod
    def check_emergency(user_text: str) -> Tuple[bool, Optional[str]]:
        """Check if user message indicates an acute medical emergency."""
        text_lower = user_text.lower()
        for kw in EMERGENCY_KEYWORDS:
            if kw in text_lower:
                msg = (
                    "🚨 **MEDICAL EMERGENCY ALERT** 🚨\n\n"
                    "If you or someone nearby is experiencing severe symptoms such as chest pain, severe shortness of breath, "
                    "heavy bleeding, stroke symptoms, or loss of consciousness, **please immediately call Emergency Services (911 or +1-800-555-9111) "
                    "or visit the nearest Hospital Emergency Room right away.**\n\n"
                    "MedVoice AI is an automated receptionist system and cannot provide emergency medical intervention or diagnosis."
                )
                return True, msg
        return False, None

    @staticmethod
    def check_diagnosis_request(user_text: str) -> Tuple[bool, Optional[str]]:
        """Check if user message asks for direct diagnosis or prescription."""
        text_lower = user_text.lower()
        for kw in DIAGNOSIS_REQUEST_KEYWORDS:
            if kw in text_lower:
                msg = (
                    "As an AI hospital receptionist assistant, I am not qualified or permitted to diagnose medical conditions "
                    "or prescribe medications. "
                    "For accurate clinical evaluation, please consult one of our licensed medical specialists.\n\n"
                    "Would you like me to help check doctor availability or schedule an appointment with one of our specialists?"
                )
                return True, msg
        return False, None
