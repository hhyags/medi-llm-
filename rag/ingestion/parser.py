import os
import re
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import pypdf

@dataclass
class DocumentMetadata:
    document_id: str
    title: str
    source: str
    source_url: str = ""
    language: str = "en"
    topic: str = ""
    category: str = "general"
    trust_level: str = "authoritative"
    version: str = "1.0"
    format: str = "md"
    published_date: str = ""
    last_reviewed: str = ""
    expiry_date: Optional[str] = None
    content_hash: str = ""

@dataclass
class DocumentChunk:
    chunk_id: str
    document_id: str
    title: str
    source: str
    section: str
    topic: str
    category: str
    language: str
    trust_level: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)

class MultiFormatParser:
    """Parses PDF, Markdown (MD), and Plain Text (TXT) files with text cleaning."""

    @staticmethod
    def extract_text_from_pdf(pdf_path: Path) -> str:
        """Extract text from a PDF file using pypdf."""
        reader = pypdf.PdfReader(str(pdf_path))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n\n".join(text_parts)

    @staticmethod
    def extract_text_from_file(file_path: Path) -> str:
        """Extract raw text from PDF, MD, or TXT file."""
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            return MultiFormatParser.extract_text_from_pdf(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize extracted medical text."""
        # Replace multiple newlines / tabs with clean spacing
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'\t+', ' ', text)
        text = re.sub(r'[ ]{2,}', ' ', text)
        # Normalize excessive blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @staticmethod
    def compute_sha256(text_or_bytes: Any) -> str:
        """Compute SHA256 content hash."""
        if isinstance(text_or_bytes, str):
            return hashlib.sha256(text_or_bytes.encode('utf-8')).hexdigest()
        elif isinstance(text_or_bytes, bytes):
            return hashlib.sha256(text_or_bytes).hexdigest()
        return ""

class DocumentChunker:
    """Chunks documents semantically based on Markdown headers or paragraph limits."""

    @staticmethod
    def chunk_document(
        raw_text: str,
        metadata: DocumentMetadata,
        max_chunk_chars: int = 800,
        overlap_chars: int = 100
    ) -> List[DocumentChunk]:
        cleaned_text = MultiFormatParser.clean_text(raw_text)
        chunks: List[DocumentChunk] = []

        # Split by Markdown sections if available (## or ###)
        sections = re.split(r'\n(?=##?\s+)', cleaned_text)

        chunk_idx = 0
        for sec in sections:
            sec_clean = sec.strip()
            if not sec_clean:
                continue

            # Extract section heading
            heading_match = re.match(r'^##?\s+(.+)$', sec_clean, re.MULTILINE)
            section_title = heading_match.group(1).strip() if heading_match else metadata.topic or "Overview"

            # If section is small enough, keep as single chunk
            if len(sec_clean) <= max_chunk_chars:
                chunk_id = f"{metadata.document_id}-chunk-{chunk_idx}"
                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=metadata.document_id,
                    title=metadata.title,
                    source=metadata.source,
                    section=section_title,
                    topic=metadata.topic,
                    category=metadata.category,
                    language=metadata.language,
                    trust_level=metadata.trust_level,
                    text=sec_clean,
                    metadata={
                        "source_url": metadata.source_url,
                        "version": metadata.version,
                        "published_date": metadata.published_date,
                        "content_hash": metadata.content_hash
                    }
                ))
                chunk_idx += 1
            else:
                # Sub-chunk longer sections with sliding window
                paragraphs = sec_clean.split("\n\n")
                curr_buf = ""
                for p in paragraphs:
                    if len(curr_buf) + len(p) <= max_chunk_chars:
                        curr_buf = f"{curr_buf}\n\n{p}".strip()
                    else:
                        if curr_buf:
                            chunk_id = f"{metadata.document_id}-chunk-{chunk_idx}"
                            chunks.append(DocumentChunk(
                                chunk_id=chunk_id,
                                document_id=metadata.document_id,
                                title=metadata.title,
                                source=metadata.source,
                                section=section_title,
                                topic=metadata.topic,
                                category=metadata.category,
                                language=metadata.language,
                                trust_level=metadata.trust_level,
                                text=curr_buf,
                                metadata={
                                    "source_url": metadata.source_url,
                                    "version": metadata.version,
                                    "published_date": metadata.published_date,
                                    "content_hash": metadata.content_hash
                                }
                            ))
                            chunk_idx += 1
                        curr_buf = p
                if curr_buf:
                    chunk_id = f"{metadata.document_id}-chunk-{chunk_idx}"
                    chunks.append(DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=metadata.document_id,
                        title=metadata.title,
                        source=metadata.source,
                        section=section_title,
                        topic=metadata.topic,
                        category=metadata.category,
                        language=metadata.language,
                        trust_level=metadata.trust_level,
                        text=curr_buf,
                        metadata={
                            "source_url": metadata.source_url,
                            "version": metadata.version,
                            "published_date": metadata.published_date,
                            "content_hash": metadata.content_hash
                        }
                    ))
                    chunk_idx += 1

        return chunks

class KnowledgeIngestionService:
    """Ingestion pipeline scanning knowledge/ directory and loading chunks."""

    @staticmethod
    def load_all_documents(knowledge_dir: Path) -> List[DocumentChunk]:
        all_chunks: List[DocumentChunk] = []
        if not knowledge_dir.exists():
            return all_chunks

        for root, _, files in os.walk(knowledge_dir):
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in [".md", ".txt", ".pdf"]:
                    file_path = Path(root) / file
                    meta_path = Path(root) / f"{file_path.stem}.json"

                    raw_text = MultiFormatParser.extract_text_from_file(file_path)
                    content_hash = MultiFormatParser.compute_sha256(raw_text)

                    # Load or generate metadata
                    if meta_path.exists():
                        try:
                            with open(meta_path, "r", encoding="utf-8") as f:
                                meta_data = json.load(f)
                        except Exception:
                            meta_data = {}
                    else:
                        meta_data = {}

                    doc_meta = DocumentMetadata(
                        document_id=meta_data.get("document_id", f"doc-{file_path.stem}"),
                        title=meta_data.get("title", file_path.stem.replace("_", " ").title()),
                        source=meta_data.get("source", "WHO / CDC Guidelines"),
                        source_url=meta_data.get("source_url", ""),
                        language=meta_data.get("language", "en"),
                        topic=meta_data.get("topic", file_path.stem.replace("_", " ")),
                        category=meta_data.get("category", "medical"),
                        trust_level=meta_data.get("trust_level", "authoritative"),
                        version=meta_data.get("version", "1.0"),
                        format=ext.replace(".", ""),
                        published_date=meta_data.get("published_date", "2024-01-01"),
                        last_reviewed=meta_data.get("last_reviewed", "2024-11-01"),
                        content_hash=content_hash
                    )

                    chunks = DocumentChunker.chunk_document(raw_text, doc_meta)
                    all_chunks.extend(chunks)

        return all_chunks
