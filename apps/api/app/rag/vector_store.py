import math
import re
from typing import List, Dict, Any, Tuple
from app.rag.ingestion import DocumentChunk

# Multilingual term mapping (Hindi, Telugu, Spanish -> English canonical medical terms)
MULTILINGUAL_LEXICON = {
    # Hindi
    "मधुमेह": "diabetes",
    "डायबिटीज": "diabetes",
    "लक्षण": "symptoms",
    "रक्तचाप": "blood pressure hypertension",
    "बीपी": "blood pressure hypertension",
    "बुखार": "fever",
    "सांस": "breath asthma respiratory",
    "दमा": "asthma",
    "दिल": "heart cardiac cardiovascular",
    "हार्ट": "heart cardiac",
    
    # Telugu
    "చక్కెర వ్యాధి": "diabetes",
    "డయాబెటిస్": "diabetes",
    "లక్షణాలు": "symptoms",
    "రక్తపోటు": "blood pressure hypertension",
    "జ్వరం": "fever",
    "గుండె": "heart cardiac cardiovascular",
    "శ్వాస": "breath asthma respiratory",

    # Spanish
    "síntomas": "symptoms",
    "presión arterial": "blood pressure hypertension",
    "hipertensión": "hypertension",
    "fiebre": "fever",
    "corazón": "heart cardiac"
}

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text."""
    # Expand multilingual terms if present
    expanded_text = text.lower()
    for foreign, english in MULTILINGUAL_LEXICON.items():
        if foreign in expanded_text:
            expanded_text += " " + english

    words = re.findall(r"\w+", expanded_text)
    stopwords = {"a", "an", "the", "is", "are", "was", "were", "what", "which", "who", "where", "how", "do", "does", "did", "can", "could", "should", "for", "of", "in", "on", "at", "to", "and", "or", "me", "my", "i", "you", "your"}
    return [w for w in words if w not in stopwords and len(w) > 1]

class MedicalVectorStore:

    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[int, float]] = []

    def build_index(self, chunks: List[DocumentChunk]):
        """Index chunks and compute TF-IDF vectors."""
        self.chunks = chunks
        if not chunks:
            return

        doc_count = len(chunks)
        df: Dict[str, int] = {}

        # 1. Tokenize all documents and build vocabulary & DF
        chunk_tokens_list = []
        for chunk in chunks:
            full_text = f"{chunk.title} {chunk.condition} {chunk.section} {chunk.text}"
            tokens = tokenize(full_text)
            chunk_tokens_list.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] = df.get(t, 0) + 1

        # 2. Build vocabulary and compute IDF
        self.vocab = {term: idx for idx, term in enumerate(df.keys())}
        self.idf = {
            term: math.log((doc_count + 1) / (freq + 1)) + 1.0
            for term, freq in df.items()
        }

        # 3. Build TF-IDF vectors for documents
        self.doc_vectors = []
        for tokens in chunk_tokens_list:
            vector: Dict[int, float] = {}
            total_tokens = len(tokens) or 1
            term_counts: Dict[str, int] = {}
            for t in tokens:
                term_counts[t] = term_counts.get(t, 0) + 1

            norm_sq = 0.0
            for term, count in term_counts.items():
                if term in self.vocab:
                    term_idx = self.vocab[term]
                    tf = count / total_tokens
                    tfidf = tf * self.idf[term]
                    vector[term_idx] = tfidf
                    norm_sq += tfidf * tfidf

            # L2 normalize vector
            norm = math.sqrt(norm_sq) or 1.0
            for term_idx in vector:
                vector[term_idx] /= norm

            self.doc_vectors.append(vector)

    def search(self, query: str, top_k: int = 3) -> List[Tuple[DocumentChunk, float]]:
        """Search vector store by query, returning ranked chunks and similarity scores."""
        if not self.chunks or not self.vocab:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        # Build L2 normalized query vector
        q_counts: Dict[str, int] = {}
        for t in query_tokens:
            q_counts[t] = q_counts.get(t, 0) + 1

        total_q_tokens = len(query_tokens)
        q_vector: Dict[int, float] = {}
        q_norm_sq = 0.0

        for term, count in q_counts.items():
            if term in self.vocab:
                term_idx = self.vocab[term]
                tf = count / total_q_tokens
                tfidf = tf * self.idf.get(term, 1.0)
                q_vector[term_idx] = tfidf
                q_norm_sq += tfidf * tfidf

        q_norm = math.sqrt(q_norm_sq) or 1.0
        for term_idx in q_vector:
            q_vector[term_idx] /= q_norm

        # Compute Cosine Similarity scores + Keyword Overlap
        scores: List[Tuple[int, float]] = []
        q_token_set = set(query_tokens)

        for doc_idx, doc_vec in enumerate(self.doc_vectors):
            dot_product = 0.0
            for term_idx, weight in q_vector.items():
                if term_idx in doc_vec:
                    dot_product += weight * doc_vec[term_idx]

            chunk = self.chunks[doc_idx]
            doc_all_text = f"{chunk.title} {chunk.condition} {chunk.section} {chunk.text}".lower()
            doc_tokens = set(tokenize(doc_all_text))

            # Token overlap score
            overlap = len(q_token_set.intersection(doc_tokens))
            overlap_score = (overlap / max(len(q_token_set), 1)) * 0.5

            final_score = dot_product + overlap_score

            scores.append((doc_idx, round(final_score, 4)))

        # Sort by similarity score descending
        scores.sort(key=lambda x: x[1], reverse=True)
        results = [(self.chunks[idx], score) for idx, score in scores[:top_k]]
        return results
