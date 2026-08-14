import httpx
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("=" * 60)
print("MEDVOICE AI — SYSTEM PREVIEW STATUS")
print("=" * 60)

# Check Backend
try:
    r_api = httpx.get("http://localhost:8000/health", timeout=5.0)
    print("✅ FastAPI Backend (http://localhost:8000):")
    print("   Status:", r_api.status_code)
    print("   Payload:", r_api.json())
except Exception as e:
    print("❌ FastAPI Backend Error:", e)

# Check Frontend Page
try:
    r_web = httpx.get("http://localhost:3000", timeout=5.0)
    print("\n✅ Next.js Frontend (http://localhost:3000):")
    print("   Status:", r_web.status_code)
    print("   Title / Length:", len(r_web.text), "bytes")
except Exception as e:
    print("❌ Next.js Frontend Error:", e)

# Check Frontend API Route -> Backend Connection
try:
    r_chat = httpx.post("http://localhost:3000/api/chat", json={"message": "What are your hospital working hours?"}, timeout=15.0)
    print("\n✅ Next.js -> FastAPI Proxy Route (/api/chat):")
    print("   Status:", r_chat.status_code)
    print("   Response:\n", r_chat.json().get("response"))
except Exception as e:
    print("❌ Proxy Route Error:", e)

print("=" * 60)
