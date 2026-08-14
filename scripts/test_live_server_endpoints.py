import httpx
import json
import sys
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

base_url = "http://localhost:8000"

print("1. Health Endpoint:")
r = httpx.get(f"{base_url}/health", timeout=10.0)
print(r.status_code, r.json())

print("\n2. Live Chat - Receptionist Info:")
r = httpx.post(f"{base_url}/chat", json={"message": "What are your hospital working hours?"}, timeout=10.0)
print("Status:", r.status_code)
print("Response:\n", r.json().get("response"))

print("\n3. Live Chat - Vertex Gemma Medical RAG:")
t0 = time.time()
r = httpx.post(f"{base_url}/chat", json={"message": "What are common symptoms of diabetes?"}, timeout=60.0)
latency = time.time() - t0
print(f"Status: {r.status_code} | Latency: {latency:.2f}s")
print("Action Taken:", r.json().get("action_taken"))
print("Grounded:", r.json().get("grounded"))
print("Citations:", r.json().get("citations"))
print("Response:\n", r.json().get("response"))
