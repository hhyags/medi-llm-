import pytest
import httpx
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from app.config import Settings
from app.llm.vertex_gemma_provider import VertexGemmaProvider, clean_gemma_output
from app.llm.enhanced_provider import LLMProviderFactory, OllamaProvider

@pytest.fixture
def dummy_settings():
    return Settings(
        llm_provider="vertex_gemma",
        vertex_gemma_model="gemma-4-31b-it",
        vertex_api_key="TEST_API_KEY_123",
        google_cloud_location="us-central1",
        llm_temperature=0.2,
        llm_max_output_tokens=512,
        llm_timeout_seconds=30.0
    )

def test_clean_gemma_output_plain_text():
    raw = "Hello! I am MedVoice AI virtual receptionist. How can I help you today?"
    cleaned = clean_gemma_output(raw)
    assert cleaned == raw

def test_clean_gemma_output_with_reasoning_bullets():
    raw = """
    * User: "Hello, who are you?"
    * Intent: Identity inquiry
    * Persona: MedVoice AI
    * Draft 1: Hi I am an AI.
    * "Hello! I am MedVoice AI, your hospital virtual receptionist. How may I assist you today?"
    """
    cleaned = clean_gemma_output(raw)
    assert "Hello! I am MedVoice AI" in cleaned
    assert "Draft 1" not in cleaned
    assert "Intent:" not in cleaned

def test_clean_gemma_output_with_thought_tags():
    raw = "<thought>User needs OPD timings</thought>Our Outpatient OPD is open Monday through Saturday, 8:00 AM to 8:00 PM."
    cleaned = clean_gemma_output(raw)
    assert cleaned == "Our Outpatient OPD is open Monday through Saturday, 8:00 AM to 8:00 PM."

def test_provider_initialization(dummy_settings):
    provider = VertexGemmaProvider(
        model="models/gemma-4-31b-it",
        api_key=dummy_settings.vertex_api_key,
        temperature=0.3,
        max_output_tokens=512,
        timeout=45.0
    )
    assert provider.model == "gemma-4-31b-it"
    assert provider.api_key == "TEST_API_KEY_123"
    assert provider.temperature == 0.3
    assert provider.max_output_tokens == 512
    assert provider.timeout == 45.0

def test_factory_creation(dummy_settings):
    provider = LLMProviderFactory.create_provider("vertex_gemma", dummy_settings)
    assert isinstance(provider, VertexGemmaProvider)
    assert provider.model == "gemma-4-31b-it"

    ollama_settings = Settings(llm_provider="ollama", ollama_base_url="http://localhost:11434", llm_model="qwen3.5:4b")
    ollama_p = LLMProviderFactory.create_provider("ollama", ollama_settings)
    assert isinstance(ollama_p, OllamaProvider)

def test_generate_success(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="gemma-4-31b-it",
            api_key="DUMMY_KEY"
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Hello, I am MedVoice AI. How can I help you?"}]
                    }
                }
            ]
        }

        with patch.object(provider.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await provider.generate("Hello")
            assert "MedVoice AI" in res
    asyncio.run(_run())

def test_structured_output_success(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="gemma-4-31b-it",
            api_key="DUMMY_KEY"
        )

        json_payload = '{"action": "book", "doctor": "Dr. Sharma"}'
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": f"```json\n{json_payload}\n```"}]
                    }
                }
            ]
        }

        with patch.object(provider.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            data = await provider.structured_output("Extract info", schema={"type": "object"})
            assert data.get("action") == "book"
            assert data.get("doctor") == "Dr. Sharma"
    asyncio.run(_run())

def test_timeout_handling(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="gemma-4-31b-it",
            api_key="DUMMY_KEY"
        )

        with patch.object(provider.client, "post", side_effect=httpx.TimeoutException("Timeout")):
            res = await provider.generate("Hello")
            assert "delay" in res.lower() or "temporarily" in res.lower()
    asyncio.run(_run())

def test_auth_error_handling(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="gemma-4-31b-it",
            api_key="INVALID_KEY"
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.text = "API_KEY_INVALID"

        with patch.object(provider.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await provider.generate("Hello")
            assert "authentication" in res.lower() or "unavailable" in res.lower()
            # Credentials or internal strings should never leak
            assert "INVALID_KEY" not in res
            assert "API_KEY_INVALID" not in res
    asyncio.run(_run())

def test_model_not_found_handling(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="nonexistent-model-xyz",
            api_key="DUMMY_KEY"
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 404

        with patch.object(provider.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await provider.generate("Hello")
            assert "unavailable" in res.lower()
            assert "nonexistent-model-xyz" in res
    asyncio.run(_run())

def test_health_check(dummy_settings):
    async def _run():
        provider = VertexGemmaProvider(
            model="gemma-4-31b-it",
            api_key="DUMMY_KEY"
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 200

        with patch.object(provider.client, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp
            healthy = await provider.health_check()
            assert healthy is True
    asyncio.run(_run())
