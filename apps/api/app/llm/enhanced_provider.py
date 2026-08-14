from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
import httpx
import json
import os
from pathlib import Path

class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        """Generate a response from the LLM."""
        pass

    @abstractmethod
    async def stream(self, prompt: str, system_prompt: Optional[str] = None, **kwargs):
        """Stream a response from the LLM."""
        pass

    @abstractmethod
    async def structured_output(self, prompt: str, schema: Dict, system_prompt: Optional[str] = None, **kwargs) -> Dict:
        """Generate a structured output from the LLM."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the LLM service is healthy."""
        pass


class OllamaProvider(BaseLLMProvider):
    """Ollama LLM provider implementation."""

    def __init__(self, base_url: str, model: str, **kwargs):
        self.base_url = base_url
        self.model = model
        self.client = httpx.AsyncClient(timeout=120.0)
        # Load system prompt
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Load system prompt from file."""
        try:
            curr = Path(__file__).resolve().parent
            for _ in range(5):
                candidate = curr / "ai" / "prompts" / "system_prompt.txt"
                if candidate.exists():
                    return candidate.read_text(encoding="utf-8")
                curr = curr.parent
        except Exception:
            pass
        return "You are MedVoice AI, a hospital receptionist and general medical information assistant."

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        """Generate a response from Ollama."""
        final_system_prompt = system_prompt or self.system_prompt
        formatted_prompt = f"{final_system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        
        payload = {
            "model": self.model,
            "prompt": formatted_prompt,
            "stream": False,
            **kwargs
        }
        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
        except httpx.TimeoutException:
            return "I am experiencing a slight delay connecting to our clinical information service. How else may I assist you with your appointment or hospital inquiry today?"
        except Exception as e:
            return f"Service temporarily busy. Please try again in a moment. ({e})"

    async def stream(self, prompt: str, system_prompt: Optional[str] = None, **kwargs):
        """Stream a response from Ollama."""
        final_system_prompt = system_prompt or self.system_prompt
        formatted_prompt = f"{final_system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        
        payload = {
            "model": self.model,
            "prompt": formatted_prompt,
            "stream": True,
            **kwargs
        }
        async with self.client.stream(
            "POST",
            f"{self.base_url}/api/generate",
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            yield data["response"]
                    except json.JSONDecodeError:
                        continue

    async def structured_output(self, prompt: str, schema: Dict, system_prompt: Optional[str] = None, **kwargs) -> Dict:
        """Generate a structured output from Ollama."""
        final_system_prompt = system_prompt or self.system_prompt
        formatted_prompt = f"""
        {final_system_prompt}
        
        {prompt}
        
        Respond with a valid JSON object that conforms to the following schema:
        {json.dumps(schema, indent=2)}
        
        Only output the JSON, no additional text.
        """
        response = await self.generate(formatted_prompt, system_prompt=final_system_prompt, **kwargs)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'(\{.*\})', response, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    pass
            return {}

    async def health_check(self) -> bool:
        """Check if Ollama is healthy."""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False


class LLMProviderFactory:
    """Factory for creating LLM providers."""

    @staticmethod
    def create_provider(provider_name: str, settings: Any, **kwargs) -> BaseLLMProvider:
        """Create an LLM provider based on the provider name."""
        name = (provider_name or "").lower().strip()
        
        if name in ["vertex_gemma", "gemma", "vertex"]:
            from app.llm.vertex_gemma_provider import VertexGemmaProvider
            return VertexGemmaProvider(
                model=getattr(settings, "vertex_gemma_model", "gemma-4-31b-it"),
                api_key=settings.get_effective_google_api_key() if hasattr(settings, "get_effective_google_api_key") else None,
                project=getattr(settings, "google_cloud_project", None),
                location=getattr(settings, "google_cloud_location", "us-central1"),
                temperature=getattr(settings, "llm_temperature", 0.2),
                max_output_tokens=getattr(settings, "llm_max_output_tokens", 1024),
                timeout=getattr(settings, "llm_timeout_seconds", 60.0),
                **kwargs
            )
        elif name == "ollama":
            return OllamaProvider(
                base_url=getattr(settings, "ollama_base_url", "http://localhost:11434"),
                model=getattr(settings, "llm_model", "qwen3.5:4b"),
                **kwargs
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider_name}. Supported providers: ['vertex_gemma', 'ollama']")