import sys
from pathlib import Path
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from rag.ingestion.parser import KnowledgeIngestionService
from rag.retrieval.qdrant_store import QdrantMedicalStore
from rag.reranking.reranker import MedicalReranker

KNOWLEDGE_DIR = Path("knowledge").resolve()
chunks = KnowledgeIngestionService.load_all_documents(KNOWLEDGE_DIR)
store = QdrantMedicalStore()
store.index_chunks(chunks)

print("Total indexed:", store.count_chunks())

for q in ["मधुमेह के लक्षण", "చక్కెర వ్యాధి లక్షణాలు"]:
    raw = store.search(q, top_k=5)
    reranked = MedicalReranker.rerank(q, raw, top_k=3)
    print(f"\nQuery: {q}")
    for c, score in reranked:
        print(f"  Score: {score} | Title: {c.title} | Lang: {c.language} | Section: {c.section}")
