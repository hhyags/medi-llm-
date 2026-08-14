from pathlib import Path
from typing import Dict, Any, List, Optional
from rag.ingestion.parser import KnowledgeIngestionService, DocumentChunk
from rag.embeddings.local_embedder import LocalDenseEmbedder
from rag.retrieval.qdrant_store import QdrantMedicalStore
from rag.reranking.reranker import MedicalReranker
from rag.citations.citation_formatter import CitationFormatter

def find_knowledge_dir() -> Path:
    """Locate the knowledge/ directory starting from current module."""
    curr = Path(__file__).resolve().parent
    for _ in range(6):
        cand = curr / "knowledge"
        if cand.exists():
            return cand
        curr = curr.parent
    return Path("knowledge").resolve()

class MedicalQdrantRAGPipeline:
    """Production Medical RAG pipeline backed by Qdrant vector store and anti-hallucination guardrails."""

    def __init__(
        self,
        llm_provider: Any,
        knowledge_dir: Optional[Path] = None,
        storage_path: Optional[str] = None
    ):
        self.llm_provider = llm_provider
        k_dir = knowledge_dir or find_knowledge_dir()
        if not any(k_dir.glob("**/*.md")) and not any(k_dir.glob("**/*.txt")):
            k_dir = find_knowledge_dir()
        self.knowledge_dir = k_dir
        self.embedder = LocalDenseEmbedder(vector_dim=128)
        self.qdrant_store = QdrantMedicalStore(embedder=self.embedder, storage_path=storage_path)
        self.ingested_chunks: List[DocumentChunk] = []

        self.initialize_knowledge_base()

    def initialize_knowledge_base(self):
        """Ingest all multi-format documents and index into Qdrant."""
        self.ingested_chunks = KnowledgeIngestionService.load_all_documents(self.knowledge_dir)
        self.qdrant_store.index_chunks(self.ingested_chunks)

    async def query(
        self,
        user_query: str,
        confidence_threshold: float = 0.35,
        language: Optional[str] = None,
        topic: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute query pipeline: Qdrant retrieval -> Reranking -> Anti-hallucination check -> LLM Generation -> Citations."""
        # 1. Search in Qdrant
        raw_candidates = self.qdrant_store.search(
            query=user_query,
            top_k=5,
            language=language,
            topic=topic
        )

        if not raw_candidates:
            return {
                "response": CitationFormatter.get_fallback_message(),
                "grounded": False,
                "confidence_score": 0.0,
                "sources": [],
                "citations": []
            }

        # 2. Rerank
        reranked = MedicalReranker.rerank(user_query, raw_candidates, top_k=3)
        top_chunk, top_score = reranked[0]

        # 3. Anti-Hallucination Confidence Gate
        if not MedicalReranker.is_confident(top_score, threshold=confidence_threshold):
            return {
                "response": CitationFormatter.get_fallback_message(),
                "grounded": False,
                "confidence_score": top_score,
                "sources": [c.source for c, _ in reranked],
                "citations": []
            }

        # 4. Assemble Grounded Context & Citations
        context_blocks = []
        selected_chunks = []
        for chunk, score in reranked:
            if score >= (confidence_threshold - 0.1):
                context_blocks.append(
                    f"Document: {chunk.title}\nSource: {chunk.source} (Topic: {chunk.topic})\nSection: {chunk.section}\nContent: {chunk.text}"
                )
                selected_chunks.append(chunk)

        combined_context = "\n\n---\n\n".join(context_blocks)
        citations = CitationFormatter.format_citations(selected_chunks)

        system_instruction = (
            "You are MedVoice AI, an authoritative medical receptionist assistant. "
            "Your response MUST be strictly grounded in the approved medical context provided below. "
            "Do NOT diagnose, do NOT prescribe, do NOT invent medical facts or dosages. "
            "Keep your tone clear, reassuring, and professional.\n\n"
            f"TRUSTED MEDICAL CONTEXT:\n{combined_context}"
        )

        llm_response = await self.llm_provider.generate(
            prompt=f"Patient Query: {user_query}\n\nProvide an educational answer grounded strictly in the trusted medical context above.",
            system_prompt=system_instruction
        )

        final_response = CitationFormatter.attach_citations(llm_response, citations)

        return {
            "response": final_response,
            "grounded": True,
            "confidence_score": top_score,
            "sources": [c.source for c in selected_chunks],
            "citations": citations,
            "retrieved_chunks": [c.chunk_id for c in selected_chunks]
        }
