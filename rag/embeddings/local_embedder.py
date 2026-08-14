import math
import re
import hashlib
from typing import List, Dict, Any, Optional

# Medical multilingual lexicon mapping to align semantics across languages
MULTILINGUAL_SYNONYMS = {
    # Hindi
    "मधुमेह": "diabetes sugar",
    "शर्करा": "glucose sugar",
    "रक्तचाप": "blood pressure hypertension",
    "उच्च रक्तचाप": "hypertension high blood pressure",
    "बुखार": "fever pyrexia",
    "खांसी": "cough bronchitis",
    "सिरदर्द": "headache migraine",
    "दिल": "heart cardiac cardiovascular",
    "छाती में दर्द": "chest pain angina",
    "सांस फूलना": "shortness of breath dyspnea",
    "थकान": "fatigue lethargy",
    "दवा": "medicine medication",
    "जांच": "test diagnostic blood test",
    "लक्षण": "symptoms indicators",
    "उपचार": "treatment management",
    "रोकथाम": "prevention preventive",
    "आहार": "diet nutrition",

    # Telugu
    "చక్కెర వ్యాధి": "diabetes sugar",
    "మధుమేహం": "diabetes mellitus",
    "రక్తపోటు": "blood pressure hypertension",
    "అధిక రక్తపోటు": "hypertension high blood pressure",
    "జ్వరం": "fever pyrexia",
    "దగ్గు": "cough",
    "తలనెప్పి": "headache migraine",
    "గుండె": "heart cardiac cardiovascular",
    "ఛాతీ నొప్పి": "chest pain angina",
    "ఆయాసం": "shortness of breath dyspnea",
    "అలసట": "fatigue",
    "లక్షణాలు": "symptoms",
    "పరీక్షలు": "tests diagnostic",
    "నివారణ": "prevention",
    "ఆహారం": "diet nutrition"
}

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text across multilingual medical vocabularies."""
    text_lower = text.lower()
    expanded = text_lower
    for non_en, en_terms in MULTILINGUAL_SYNONYMS.items():
        if non_en in expanded:
            expanded += " " + en_terms

    # Extract words (including unicode/Indic script characters)
    tokens = re.findall(r'[\w\u0900-\u097F\u0C00-\u0C7F]+', expanded)
    stopwords = {
        "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with",
        "of", "is", "are", "was", "were", "what", "how", "when", "why", "who",
        "can", "you", "tell", "me", "about", "please", "i", "have", "my"
    }
    return [t for t in tokens if t not in stopwords and len(t) > 1]

class LocalDenseEmbedder:
    """Fast, deterministic local embedding engine generating normalized vectors."""

    def __init__(self, vector_dim: int = 128):
        self.vector_dim = vector_dim

    def _hash_term(self, term: str) -> int:
        """Hash a term into a deterministic index in [0, vector_dim - 1]."""
        h = int(hashlib.md5(term.encode('utf-8')).hexdigest(), 16)
        return h % self.vector_dim

    def embed_text(self, text: str) -> List[float]:
        """Embed a single text string into a normalized dense vector."""
        tokens = tokenize(text)
        if not tokens:
            return [0.0] * self.vector_dim

        vec = [0.0] * self.vector_dim
        for token in tokens:
            idx = self._hash_term(token)
            # Use term hash sign for balanced projection
            sign = 1.0 if (hash(token) % 2 == 0) else 1.0
            vec[idx] += 1.0 * sign

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of document texts."""
        return [self.embed_text(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        """Embed a search query."""
        return self.embed_text(query)
