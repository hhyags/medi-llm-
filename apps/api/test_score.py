from pathlib import Path
from app.rag.ingestion import DocumentIngestionService
from app.rag.vector_store import MedicalVectorStore

# Get exact project root: D:\medi\medvoice-ai
project_root = Path(__file__).resolve().parent.parent.parent
kb_dir = project_root / "ai" / "knowledge_base"
print("Project root:", project_root)
print("KB dir:", kb_dir, "exists:", kb_dir.exists())

chunks = DocumentIngestionService.load_knowledge_base(kb_dir)
print("Chunks loaded:", len(chunks))

vs = MedicalVectorStore()
vs.build_index(chunks)
res = vs.search("What are common symptoms of diabetes?")
for c, s in res:
    print(f"Score: {s} | Title: {c.title} | Section: {c.section}")
