# MedVoice AI

MedVoice AI is an intelligent, multilingual hospital virtual receptionist and first-level safety-triage assistant powered by **Google Vertex AI Gemma** and local LLMs.

---

## 🏛️ System Architecture

```
                                  Patient / Caller
                                         │
                                         ▼
                            Next.js Web / Voice Frontend
                                         │
                                         ▼
                               FastAPI Backend (/chat)
                                         │
                                         ▼
                                  AI Orchestrator
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             ▼                           ▼                           ▼
      [Safety Layer]            [Hospital Tools]             [Medical RAG]
     • Acute Emergencies       • Doctor Availability        • WHO / CDC / ICMR /
     • Immediate Triage        • Appointments & DB            MedlinePlus Guidelines
     • Red Flag Warnings       • OPD Hours & Contact        • Qdrant Vector Store
                                                            • Anti-Hallucination Gate
                                         │
                                         ▼
                         LLM Provider (BaseLLMProvider)
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
             VertexGemmaProvider                       OllamaProvider
             (Google Vertex Gemma)                     (Local Qwen)
```

---

## 📁 Project Structure

```
medvoice-ai/
├── knowledge/                     # Authoritative Medical Knowledge Base (56 docs)
│   ├── medical/                   # Conditions, Symptoms, Tests, Procedures, Prevention
│   ├── emergency/                 # Acute Triage Protocols
│   ├── patient_education/         # Chronic Care Management
│   ├── multilingual/              # English, Telugu (తెలుగు), Hindi (हिन्दी)
│   └── metadata/                  # Central metadata catalogue & SHA256 hashes
│
├── rag/                           # Production RAG Engine Subsystem
│   ├── ingestion/                 # Multi-format Parser (PDF, TXT, MD) & Semantic Chunker
│   ├── embeddings/                # Local Embeddings & Multilingual Lexicon Engine
│   ├── retrieval/                 # Local Embedded Qdrant Vector Store
│   ├── reranking/                 # Semantic Reranker & Confidence Thresholding
│   ├── citations/                 # Structured Authoritative Citation Builder
│   └── pipeline.py                # End-to-End MedicalQdrantRAGPipeline
│
├── apps/
│   ├── api/                       # FastAPI Backend, LLM Providers & Orchestrator
│   └── web/                       # Next.js Frontend Chat Interface
│
├── docs/                          # Architecture & Integration Guides
│   └── gemma.md                   # Vertex AI Gemma Setup & Configuration
│
└── tests/
    ├── unit/                      # Provider, Tools, & Safety Unit Tests
    └── rag/                       # Ingestion, Qdrant, & Multilingual RAG Tests
```

---

## 🚀 Getting Started

### 1. Configure Environment (`apps/api/.env`)
```ini
LLM_PROVIDER=vertex_gemma
VERTEX_GEMMA_MODEL=gemma-4-31b-it
VERTEX_API_KEY=your_google_api_key_here
```

### 2. Start the FastAPI Backend
```bash
cd apps/api
.\.venv\Scripts\activate
python main.py
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Start the Next.js Frontend
```bash
cd apps/web
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 🧪 Testing & Verification

Run the full automated test suite (50+ tests):
```bash
powershell -Command ".\apps\api\.venv\Scripts\python.exe -m pytest tests/unit/ tests/rag/ -v"
```

Run the end-to-end Gemma migration verification:
```bash
powershell -Command ".\apps\api\.venv\Scripts\python.exe scripts/verify_gemma_migration_e2e.py"
```
