import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from rag.pipeline import MedicalQdrantRAGPipeline, find_knowledge_dir
from rag.ingestion.parser import DocumentChunk
from app.llm.enhanced_provider import BaseLLMProvider

class MedicalRAGPipeline:
    """FastAPI adapter for the root MedicalQdrantRAGPipeline."""

    def __init__(self, llm_provider: BaseLLMProvider, kb_dir: Optional[Path] = None):
        self.qdrant_pipeline = MedicalQdrantRAGPipeline(
            llm_provider=llm_provider,
            knowledge_dir=kb_dir
        )
        self.vector_store = self.qdrant_pipeline.qdrant_store

    async def query(
        self,
        user_query: str,
        confidence_threshold: float = 0.35,
        language: Optional[str] = None,
        topic: Optional[str] = None
    ) -> Dict[str, Any]:
        return await self.qdrant_pipeline.query(
            user_query=user_query,
            confidence_threshold=confidence_threshold,
            language=language,
            topic=topic
        )
