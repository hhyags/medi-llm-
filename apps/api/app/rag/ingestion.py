import os
import json
from pathlib import Path
from typing import List, Dict, Any

class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        title: str,
        source: str,
        authority: str,
        section: str,
        condition: str,
        language: str,
        text: str
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.title = title
        self.source = source
        self.authority = authority
        self.section = section
        self.condition = condition
        self.language = language
        self.text = text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "title": self.title,
            "source": self.source,
            "authority": self.authority,
            "section": self.section,
            "condition": self.condition,
            "language": self.language,
            "text": self.text
        }

class DocumentIngestionService:

    @staticmethod
    def load_knowledge_base(kb_dir: Path) -> List[DocumentChunk]:
        """Load all medical knowledge base documents and chunk them."""
        chunks = []
        if not kb_dir.exists():
            return chunks

        for file_path in kb_dir.glob("*.json"):
            try:
                data = json.loads(file_path.read_text(encoding="utf-8"))
                for doc in data:
                    doc_id = doc.get("id", "doc_unknown")
                    title = doc.get("title", "Medical Guideline")
                    source = doc.get("source", "Approved Medical Source")
                    authority = doc.get("authority", "Healthcare Authority")
                    section = doc.get("section", "General Information")
                    condition = doc.get("condition", "General")
                    lang = doc.get("language", "en")
                    content = doc.get("content", "")

                    # Create document chunk
                    chunk = DocumentChunk(
                        chunk_id=f"{doc_id}_c0",
                        document_id=doc_id,
                        title=title,
                        source=source,
                        authority=authority,
                        section=section,
                        condition=condition,
                        language=lang,
                        text=content
                    )
                    chunks.append(chunk)
            except Exception as e:
                print(f"Error loading knowledge base file {file_path}: {e}")

        return chunks
