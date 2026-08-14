import os
from pathlib import Path
from typing import Optional, Union, Tuple
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

_API_ENV = Path(__file__).resolve().parent.parent / ".env"
_ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_API_ENV, _ROOT_ENV, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    app_env: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./test.db")
    secret_key: str = Field(default="your-secret-key-here")
    log_level: str = Field(default="INFO")

    # LLM Provider Configuration (ollama, vertex_gemma, gemini)
    llm_provider: str = Field(default="vertex_gemma")
    llm_model: str = Field(default="qwen3.5:4b")
    llm_temperature: float = Field(default=0.2)
    llm_max_output_tokens: int = Field(default=1024)
    llm_timeout_seconds: float = Field(default=60.0)

    # Ollama Specific
    ollama_base_url: str = Field(default="http://localhost:11434")

    # Google Vertex AI / Gemma Specific
    google_cloud_project: Optional[str] = Field(default=None)
    google_cloud_location: str = Field(default="us-central1")
    vertex_gemma_model: str = Field(default="gemma-4-31b-it")
    vertex_api_key: Optional[str] = Field(default=None)
    google_api_key: Optional[str] = Field(default=None)
    gemini_api_key: Optional[str] = Field(default=None)

    def get_effective_google_api_key(self) -> Optional[str]:
        """Return the active Google/Vertex API key from config or env."""
        return (
            self.vertex_api_key
            or self.google_api_key
            or self.gemini_api_key
            or os.environ.get("VERTEX_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GEMINI_API_KEY")
        )

    def validate_provider_settings(self):
        """Validate that the active provider has required configuration."""
        provider = self.llm_provider.lower()
        if provider in ["vertex_gemma", "gemma", "vertex"]:
            key = self.get_effective_google_api_key()
            project = self.google_cloud_project or os.environ.get("GOOGLE_CLOUD_PROJECT")
            if not key and not project and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
                pass
        elif provider == "ollama":
            if not self.ollama_base_url:
                raise ValueError("OLLAMA_BASE_URL is required when LLM_PROVIDER=ollama")

settings = Settings()