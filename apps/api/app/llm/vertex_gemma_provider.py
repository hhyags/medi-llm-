import os
import re
import json
import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import httpx

from app.llm.enhanced_provider import BaseLLMProvider

logger = logging.getLogger(__name__)

def clean_gemma_output(text: str) -> str:
    """Normalize and clean Gemma output, stripping thought traces/scratchpads if present."""
    if not text:
        return ""

    # Strip XML-style thinking tags if any
    cleaned = re.sub(r'<thought>.*?</thought>', '', text, flags=re.DOTALL)
    cleaned = re.sub(r'<reasoning>.*?</reasoning>', '', cleaned, flags=re.DOTALL)

    # Check if there is a quoted final response inside or at the end
    # E.g. * *Refining for Role:* "Hello. Based on the clinical practice guidelines..."
    quoted_matches = re.findall(r'"([^"\n]{20,})"', cleaned)
    if quoted_matches:
        candidate = quoted_matches[-1].strip()
        if not candidate.lower().startswith("what is") and not candidate.lower().startswith("hello, who"):
            return candidate

    lines = cleaned.strip().split("\n")
    clean_lines = []
    
    # Filter out meta-reasoning bullets
    meta_pattern = re.compile(
        r'^\s*(\*|-)\s*(\*?(User|Intent|Persona|Constraints|Identity|Role|Capabilities|Draft|Thought|Context|Strictly|Refining|Tone|Since the|The provided)\b|\*{1,2}[A-Za-z\s]+:?\*{1,2})',
        re.I
    )
    
    for l in lines:
        if not meta_pattern.match(l):
            clean_lines.append(l)

    result = "\n".join(clean_lines).strip()
    if result.startswith('"') and result.endswith('"') and len(result) > 2:
        result = result[1:-1].strip()
    
    return result if result else cleaned.strip()

class VertexGemmaProvider(BaseLLMProvider):
    """Google Cloud Vertex AI & Google AI Studio Gemma Provider."""

    def __init__(
        self,
        model: str = "gemma-4-31b-it",
        api_key: Optional[str] = None,
        project: Optional[str] = None,
        location: str = "us-central1",
        temperature: float = 0.2,
        max_output_tokens: int = 1024,
        timeout: float = 60.0,
        **kwargs
    ):
        self.model = model.replace("models/", "")
        self.api_key = api_key or os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        self.project = project or os.environ.get("GOOGLE_CLOUD_PROJECT")
        self.location = location or os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Load central system prompt."""
        try:
            curr = Path(__file__).resolve().parent
            for _ in range(5):
                candidate = curr / "ai" / "prompts" / "system_prompt.txt"
                if candidate.exists():
                    return candidate.read_text(encoding="utf-8")
                curr = curr.parent
        except Exception:
            pass
        return "You are MedVoice AI, an authoritative hospital virtual receptionist and medical information assistant."

    def _get_api_url(self) -> str:
        """Construct the appropriate Google API endpoint URL."""
        if self.api_key:
            return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        elif self.project:
            # Vertex AI regional endpoint
            return f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project}/locations/{self.location}/publishers/google/models/{self.model}:rawPredict"
        else:
            return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        """Generate response with Gemma on Google Vertex AI / Developer API."""
        final_system_prompt = system_prompt or self.system_prompt
        
        # Build payload
        payload = {
            "systemInstruction": {
                "parts": [{"text": f"{final_system_prompt}\n\nCRITICAL: Do NOT output thought processes, reasoning notes, or draft bullets. Output ONLY the clean final conversational response."}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": kwargs.get("temperature", self.temperature),
                "maxOutputTokens": kwargs.get("max_output_tokens", self.max_output_tokens)
            }
        }

        url = self._get_api_url()

        # Retry transient errors with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await self.client.post(url, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "")
                            return clean_gemma_output(raw_text)
                    return ""
                
                elif response.status_code in [401, 403]:
                    logger.error("Authentication error accessing Vertex Gemma API.")
                    return "The clinical assistant service is currently unavailable due to authentication configuration. Please contact the administrator."
                
                elif response.status_code == 404:
                    logger.error(f"Configured Gemma model '{self.model}' is unavailable on Vertex AI.")
                    return f"Configured Gemma model '{self.model}' is unavailable."
                
                elif response.status_code == 429:
                    logger.warning(f"Rate limited by Vertex Gemma API (attempt {attempt + 1}/{max_retries}).")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    return "The AI service is experiencing high traffic. Please try again shortly."
                
                elif response.status_code >= 500:
                    logger.warning(f"Vertex Gemma provider error {response.status_code} (attempt {attempt + 1}/{max_retries}).")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    return "The AI service is temporarily unavailable. Please try again in a few moments."
                
                else:
                    logger.error(f"Unexpected response from Vertex Gemma API: {response.status_code}")
                    return "The medical virtual receptionist service is momentarily unavailable."

            except httpx.TimeoutException:
                logger.warning(f"Request timeout connecting to Vertex Gemma API (attempt {attempt + 1}/{max_retries}).")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5)
                    continue
                return "I am experiencing a slight network delay. How else may I assist you with your appointment or hospital inquiry today?"

            except Exception as e:
                logger.error(f"Network/Connection error with Vertex Gemma API: {type(e).__name__}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5)
                    continue
                return "The AI service is temporarily unavailable. Please try again in a few moments."

        return "Service temporarily busy. Please try again in a moment."

    async def stream(self, prompt: str, system_prompt: Optional[str] = None, **kwargs):
        """Stream response from Gemma."""
        # Non-streaming fallback generator
        full_text = await self.generate(prompt, system_prompt=system_prompt, **kwargs)
        for word in full_text.split(" "):
            yield word + " "

    async def structured_output(self, prompt: str, schema: Dict, system_prompt: Optional[str] = None, **kwargs) -> Dict:
        """Generate validated structured JSON output from Gemma."""
        final_system_prompt = system_prompt or self.system_prompt
        json_instruction = (
            f"{final_system_prompt}\n\n"
            f"You must respond ONLY with a valid JSON object strictly matching this schema:\n"
            f"{json.dumps(schema, indent=2)}\n"
            f"Do not wrap in markdown quotes or extra text. Output raw JSON only."
        )

        response_text = await self.generate(prompt, system_prompt=json_instruction, **kwargs)
        
        # Strip potential markdown formatting
        cleaned_json = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned_json = re.sub(r'```$', '', cleaned_json).strip()

        try:
            return json.loads(cleaned_json)
        except json.JSONDecodeError:
            # Match first json block in text
            match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    pass
            return {}

    async def health_check(self) -> bool:
        """Check if Vertex Gemma API is reachable and healthy."""
        if not self.api_key and not self.project:
            return False
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}" if self.api_key else self._get_api_url()
            resp = await self.client.get(url, timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False
