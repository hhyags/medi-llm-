from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.rag.pipeline import MedicalRAGPipeline
from app.llm.enhanced_provider import LLMProviderFactory
from app.config import Settings

router = APIRouter(prefix="/api/rag", tags=["Medical Qdrant RAG"])

settings = Settings()
llm = LLMProviderFactory.create_provider(settings.llm_provider, settings)
rag_pipeline = MedicalRAGPipeline(llm)

class RAGQueryRequest(BaseModel):
    query: str = Field(..., example="What are common symptoms of diabetes?")
    confidence_threshold: float = Field(0.35, example=0.35)
    language: Optional[str] = Field(None, example="en")
    topic: Optional[str] = Field(None, example="diabetes")

@router.post("/query")
async def query_rag(req: RAGQueryRequest):
    """Query the verified medical knowledge base via Qdrant."""
    result = await rag_pipeline.query(
        user_query=req.query,
        confidence_threshold=req.confidence_threshold,
        language=req.language,
        topic=req.topic
    )
    return result

@router.get("/documents")
def get_rag_documents():
    """Get metadata summary of all loaded knowledge base chunks from Qdrant."""
    chunks = rag_pipeline.qdrant_pipeline.ingested_chunks
    return {
        "total_chunks": len(chunks),
        "qdrant_points_count": rag_pipeline.vector_store.count_chunks(),
        "documents": [
            {
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "title": c.title,
                "source": c.source,
                "section": c.section,
                "topic": c.topic,
                "category": c.category,
                "language": c.language,
                "trust_level": c.trust_level
            }
            for c in chunks
        ]
    }
