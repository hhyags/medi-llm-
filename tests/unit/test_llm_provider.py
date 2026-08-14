import pytest
from app.llm.provider import BaseLLMProvider, OllamaProvider, LLMProviderFactory
from app.config import Settings

class MockLLMProvider(BaseLLMProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        return "Mock response"

    async def stream(self, prompt: str, **kwargs):
        yield "Mock"
        yield " "
        yield "stream"

    async def structured_output(self, prompt: str, schema: dict, **kwargs) -> dict:
        return {"mock": "response"}

    async def health_check(self) -> bool:
        return True

def test_base_llm_provider():
    """Test that BaseLLMProvider is abstract."""
    with pytest.raises(TypeError):
        BaseLLMProvider()

def test_ollama_provider_init():
    """Test OllamaProvider initialization."""
    settings = Settings()
    provider = OllamaProvider(
        base_url=settings.ollama_base_url,
        model=settings.llm_model
    )
    assert provider.base_url == settings.ollama_base_url
    assert provider.model == settings.llm_model

def test_llm_provider_factory():
    """Test LLMProviderFactory."""
    settings = Settings()
    provider = LLMProviderFactory.create_provider("ollama", settings)
    assert isinstance(provider, OllamaProvider)

def test_llm_provider_factory_invalid():
    """Test LLMProviderFactory with invalid provider."""
    settings = Settings()
    with pytest.raises(ValueError):
        LLMProviderFactory.create_provider("invalid", settings)