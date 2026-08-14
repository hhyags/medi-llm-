import httpx
import json

def test_emb():
    r = httpx.post('http://localhost:11434/api/embeddings', json={'model': 'qwen3.5:4b', 'prompt': 'test medical embedding'}, timeout=10.0)
    print("Status:", r.status_code)
    vec = r.json().get('embedding', [])
    print("Vector len:", len(vec))

if __name__ == "__main__":
    test_emb()
