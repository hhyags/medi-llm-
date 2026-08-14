import re
from typing import List, Tuple
from rag.ingestion.parser import DocumentChunk
from rag.embeddings.local_embedder import tokenize

class MedicalReranker:
    """Reranks and scores medical document candidates based on semantic overlap."""

    @staticmethod
    def rerank(
        query: str,
        candidates: List[Tuple[DocumentChunk, float]],
        top_k: int = 3
    ) -> List[Tuple[DocumentChunk, float]]:
        """Rerank candidates using vector similarity plus lexical overlap."""
        if not candidates:
            return []

        query_tokens = set(tokenize(query))
        scored: List[Tuple[DocumentChunk, float]] = []

        for chunk, vec_score in candidates:
            doc_text = f"{chunk.title} {chunk.topic} {chunk.section} {chunk.text}".lower()
            doc_tokens = set(tokenize(doc_text))

            # Compute token overlap ratio
            if query_tokens:
                overlap = len(query_tokens.intersection(doc_tokens))
                lexical_score = overlap / len(query_tokens)
            else:
                lexical_score = 0.0

            # Topic exact match boost
            topic_boost = 0.2 if chunk.topic and chunk.topic.lower() in query.lower() else 0.0

            # Combined normalized score
            composite_score = (0.5 * vec_score) + (0.35 * lexical_score) + topic_boost
            scored.append((chunk, round(composite_score, 4)))

        # Sort descending by composite score
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    @staticmethod
    def is_confident(score: float, threshold: float = 0.35) -> bool:
        """Evaluate if top retrieved chunk meets the anti-hallucination confidence threshold."""
        return score >= threshold
