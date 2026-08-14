import pytest
from pathlib import Path
from rag.ingestion.parser import (
    MultiFormatParser,
    DocumentChunker,
    KnowledgeIngestionService,
    DocumentMetadata
)

BASE_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

def test_extract_text_from_txt():
    txt_file = KNOWLEDGE_DIR / "medical" / "symptoms" / "fever.txt"
    assert txt_file.exists(), "fever.txt should exist in knowledge base"
    text = MultiFormatParser.extract_text_from_file(txt_file)
    assert len(text) > 50
    assert "Fever" in text

def test_extract_text_from_markdown():
    md_file = KNOWLEDGE_DIR / "medical" / "conditions" / "diabetes_mellitus.md"
    assert md_file.exists(), "diabetes_mellitus.md should exist"
    text = MultiFormatParser.extract_text_from_file(md_file)
    assert "Diabetes" in text
    assert "Diagnostic Criteria" in text

def test_extract_text_from_pdf():
    pdf_file = KNOWLEDGE_DIR / "medical" / "conditions" / "cardiovascular_health_who.pdf"
    assert pdf_file.exists(), "cardiovascular_health_who.pdf should exist"
    text = MultiFormatParser.extract_text_from_file(pdf_file)
    assert "Cardiovascular" in text or "WHO" in text

def test_text_cleaning_and_hashing():
    raw = "  # Medical Title \r\n\r\n\tBody with   extra    spaces. \n\n\n\nNext line.  "
    cleaned = MultiFormatParser.clean_text(raw)
    assert "\r" not in cleaned
    assert "\t" not in cleaned
    assert "   " not in cleaned
    h = MultiFormatParser.compute_sha256(cleaned)
    assert len(h) == 64

def test_chunking_with_headers():
    doc_meta = DocumentMetadata(
        document_id="test-doc-001",
        title="Test Diabetes",
        source="WHO",
        topic="diabetes",
        category="condition",
        language="en"
    )
    raw_md = (
        "## Overview\nDiabetes is a metabolic disease.\n\n"
        "## Symptoms\nExcessive thirst and frequent urination.\n\n"
        "## Treatment\nDiet and insulin management."
    )
    chunks = DocumentChunker.chunk_document(raw_md, doc_meta)
    assert len(chunks) == 3
    assert chunks[0].section == "Overview"
    assert chunks[1].section == "Symptoms"
    assert chunks[2].section == "Treatment"
    for c in chunks:
        assert c.document_id == "test-doc-001"
        assert c.source == "WHO"

def test_knowledge_ingestion_service_loads_all():
    chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
    assert len(chunks) >= 30, f"Expected at least 30 chunks, found {len(chunks)}"
    first = chunks[0]
    assert first.chunk_id != ""
    assert first.text != ""
    assert first.title != ""
