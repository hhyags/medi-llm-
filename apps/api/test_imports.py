import sys
print(f"Python version: {sys.version}")

try:
    import pydantic
    print(f"Pydantic version: {pydantic.VERSION}")
except Exception as e:
    print(f"Pydantic import error: {e}")

try:
    import fastapi
    print("FastAPI imported successfully")
except Exception as e:
    print(f"FastAPI import error: {e}")

try:
    import uvicorn
    print("Uvicorn imported successfully")
except Exception as e:
    print(f"Uvicorn import error: {e}")

try:
    import httpx
    print("HTTPX imported successfully")
except Exception as e:
    print(f"HTTPX import error: {e}")