from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)

from rag.ingestion.parser import DocumentChunk
from rag.embeddings.local_embedder import LocalDenseEmbedder

COLLECTION_NAME = "medvoice_medical_kb"

class QdrantMedicalStore:
    """Local embedded Qdrant vector database for medical knowledge chunks."""

    def __init__(
        self,
        embedder: Optional[LocalDenseEmbedder] = None,
        storage_path: Optional[str] = None
    ):
        self.embedder = embedder or LocalDenseEmbedder(vector_dim=128)
        self.vector_dim = self.embedder.vector_dim

        if storage_path:
            Path(storage_path).mkdir(parents=True, exist_ok=True)
            self.client = QdrantClient(path=storage_path)
        else:
            self.client = QdrantClient(":memory:")

        self.collection_name = COLLECTION_NAME
        self._ensure_collection()

    def _ensure_collection(self):
        """Create or verify the Qdrant collection."""
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.vector_dim, distance=Distance.COSINE)
            )

    def index_chunks(self, chunks: List[DocumentChunk]):
        """Index or upsert a list of document chunks into Qdrant."""
        if not chunks:
            return

        points: List[PointStruct] = []
        for idx, chunk in enumerate(chunks):
            # Text to embed: title + condition + section + body
            full_context = f"{chunk.title} {chunk.topic} {chunk.section} {chunk.text}"
            vector = self.embedder.embed_text(full_context)

            payload = {
                "chunk_id": chunk.chunk_id,
                "document_id": chunk.document_id,
                "title": chunk.title,
                "source": chunk.source,
                "section": chunk.section,
                "topic": chunk.topic,
                "category": chunk.category,
                "language": chunk.language,
                "trust_level": chunk.trust_level,
                "text": chunk.text,
                "metadata": chunk.metadata
            }

            points.append(PointStruct(
                id=idx + 1,
                vector=vector,
                payload=payload
            ))

        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )

    def search(
        self,
        query: str,
        top_k: int = 4,
        language: Optional[str] = None,
        topic: Optional[str] = None,
        category: Optional[str] = None,
        trust_level: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """Search Qdrant collection with optional payload filters."""
        query_vector = self.embedder.embed_query(query)

        # Build Qdrant filter conditions
        filter_conditions = []
        if language:
            filter_conditions.append(FieldCondition(key="language", match=MatchValue(value=language)))
        if topic:
            filter_conditions.append(FieldCondition(key="topic", match=MatchValue(value=topic)))
        if category:
            filter_conditions.append(FieldCondition(key="category", match=MatchValue(value=category)))
        if trust_level:
            filter_conditions.append(FieldCondition(key="trust_level", match=MatchValue(value=trust_level)))

        qdrant_filter = Filter(must=filter_conditions) if filter_conditions else None

        # Execute search in Qdrant (using query_points for qdrant-client >= 1.10)
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=qdrant_filter,
                limit=top_k
            ).points
        except Exception:
            # Fallback to search() if query_points is not supported
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=qdrant_filter,
                limit=top_k
            )

        matched_chunks: List[Tuple[DocumentChunk, float]] = []
        for res in results:
            p = res.payload
            chunk = DocumentChunk(
                chunk_id=p.get("chunk_id", ""),
                document_id=p.get("document_id", ""),
                title=p.get("title", ""),
                source=p.get("source", ""),
                section=p.get("section", ""),
                topic=p.get("topic", ""),
                category=p.get("category", ""),
                language=p.get("language", "en"),
                trust_level=p.get("trust_level", "authoritative"),
                text=p.get("text", ""),
                metadata=p.get("metadata", {})
            )
            score = float(res.score) if hasattr(res, "score") else 0.0
            matched_chunks.append((chunk, score))

        return matched_chunks

    def count_chunks(self) -> int:
        """Return total indexed points in collection."""
        try:
            return self.client.get_collection(self.collection_name).points_count or 0
        except Exception:
            return 0
