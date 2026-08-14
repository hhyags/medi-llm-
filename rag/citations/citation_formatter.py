from typing import List
from rag.ingestion.parser import DocumentChunk

class CitationFormatter:
    """Formats structured authoritative citations from retrieved medical chunks."""

    @staticmethod
    def format_citations(chunks: List[DocumentChunk]) -> List[str]:
        citations = []
        for chunk in chunks:
            citation_str = f"[{chunk.source} — {chunk.title} — {chunk.section}]"
            if citation_str not in citations:
                citations.append(citation_str)
        return citations

    @staticmethod
    def attach_citations(response_text: str, citations: List[str]) -> str:
        if not citations:
            return response_text

        citation_block = "\n\n**Approved Medical References:**\n" + "\n".join(f"• {c}" for c in citations)
        return f"{response_text.strip()}{citation_block}"

    @staticmethod
    def get_fallback_message() -> str:
        return (
            "I do not have sufficient validated medical documentation to answer your specific query with confidence. "
            "For your safety and accurate guidance, please consult one of our hospital specialists."
        )
