import os
import sys
from pathlib import Path
import httpx
import json

PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_DIR = PROJECT_ROOT / "apps" / "api"
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.config import Settings

settings = Settings()
api_key = settings.get_effective_google_api_key()
model = settings.vertex_gemma_model

if not api_key:
    print("VERTEX_API_KEY / GOOGLE_API_KEY not set in environment or .env.")
    sys.exit(0)

url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

system_prompt = (
    "You are MedVoice AI, an authoritative hospital virtual receptionist and first-level medical information assistant. "
    "Respond politely, professionally, and concisely."
)

payload = {
    "systemInstruction": {
        "parts": [{"text": system_prompt}]
    },
    "contents": [
        {
            "role": "user",
            "parts": [{"text": "Hello, who are you and how can you help me?"}]
        }
    ],
    "generationConfig": {
        "temperature": 0.1,
        "maxOutputTokens": 256
    }
}

try:
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, json=payload)
        print("Status code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0]["content"]["parts"][0]["text"]
                print("Generated response:\n", text)
        else:
            print("Error response:", resp.text)
except Exception as e:
    print("Exception:", e)
