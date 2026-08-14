import asyncio
import pytest
from pathlib import Path
from rag.ingestion.parser import KnowledgeIngestionService
from rag.embeddings.local_embedder import LocalDenseEmbedder
from rag.retrieval.qdrant_store import QdrantMedicalStore
from rag.reranking.reranker import MedicalReranker
from rag.citations.citation_formatter import CitationFormatter
from rag.pipeline import MedicalQdrantRAGPipeline

BASE_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

class MockLLM:
    async def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        return "Diabetes is a metabolic condition characterized by elevated blood glucose levels."

def test_embedder_dimension_and_normalization():
    embedder = LocalDenseEmbedder(vector_dim=128)
    vec = embedder.embed_text("What are symptoms of diabetes?")
    assert len(vec) == 128
    # L2 norm should be approximately 1.0
    norm = sum(v * v for v in vec)
    assert 0.99 <= norm <= 1.01

def test_qdrant_indexing_and_search():
    chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
    assert len(chunks) > 0

    qdrant_store = QdrantMedicalStore()
    qdrant_store.index_chunks(chunks)
    assert qdrant_store.count_chunks() == len(chunks)

    # Search query
    results = qdrant_store.search("What are the diagnostic blood tests for diabetes?", top_k=3)
    assert len(results) > 0
    top_chunk, score = results[0]
    assert "diabetes" in top_chunk.title.lower() or "diabetes" in top_chunk.topic.lower() or "blood glucose" in top_chunk.topic.lower()

def test_qdrant_payload_filtering():
    chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
    qdrant_store = QdrantMedicalStore()
    qdrant_store.index_chunks(chunks)

    # Filter by language = hi
    hi_results = qdrant_store.search("मधुमेह", top_k=2, language="hi")
    assert len(hi_results) > 0
    for chunk, _ in hi_results:
        assert chunk.language == "hi"

    # Filter by language = te
    te_results = qdrant_store.search("చక్కెర వ్యాధి", top_k=2, language="te")
    assert len(te_results) > 0
    for chunk, _ in te_results:
        assert chunk.language == "te"

def test_reranking_and_confidence():
    chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
    qdrant_store = QdrantMedicalStore()
    qdrant_store.index_chunks(chunks)

    raw_candidates = qdrant_store.search("hypertension blood pressure numbers", top_k=5)
    reranked = MedicalReranker.rerank("hypertension blood pressure numbers", raw_candidates, top_k=3)
    assert len(reranked) > 0
    top_chunk, top_score = reranked[0]
    assert top_score >= 0.35
    assert "hypertension" in top_chunk.topic.lower()

def test_citations_formatting():
    chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
    selected = chunks[:2]
    citations = CitationFormatter.format_citations(selected)
    assert len(citations) == 2
    for c in citations:
        assert c.startswith("[") and c.endswith("]")

def test_low_confidence_fallback():
    async def run():
        mock_llm = MockLLM()
        pipeline = MedicalQdrantRAGPipeline(llm_provider=mock_llm, knowledge_dir=KNOWLEDGE_DIR)
        res = await pipeline.query("How to repair an aircraft supersonic jet turbine?", confidence_threshold=0.45)
        assert res["grounded"] is False
        assert "not have sufficient validated medical documentation" in res["response"]
    asyncio.run(run())

def test_multilingual_end_to_end_rag():
    async def run():
        mock_llm = MockLLM()
        pipeline = MedicalQdrantRAGPipeline(llm_provider=mock_llm, knowledge_dir=KNOWLEDGE_DIR)
        
        # Hindi query
        hi_res = await pipeline.query("मधुमेह के लक्षण")
        assert hi_res["grounded"] is True
        assert len(hi_res["citations"]) > 0

        # Telugu query
        te_res = await pipeline.query("చక్కెర వ్యాధి లక్షణాలు")
        assert te_res["grounded"] is True
        assert len(te_res["citations"]) > 0
    asyncio.run(run())
