import os
import faiss
import numpy as np
from pymongo import MongoClient

class VectorDB:
    """Singleton for FAISS indexing and search."""
    _instance = None
    _index = None
    _id_map = [] # maps FAISS integer ID -> MongoDB string ID
    _INDEX_PATH = "models/faiss.index"
    _ID_MAP_PATH = "models/faiss_map.txt"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorDB, cls).__new__(cls)
            cls._instance._load_index()
        return cls._instance

    def _load_index(self):
        os.makedirs("models", exist_ok=True)
        if os.path.exists(self._INDEX_PATH) and os.path.exists(self._ID_MAP_PATH):
            print("[FAISS] Loading existing index...")
            self._index = faiss.read_index(self._INDEX_PATH)
            with open(self._ID_MAP_PATH, "r") as f:
                self._id_map = [line.strip() for line in f.readlines()]
            print(f"[FAISS] Loaded {self._index.ntotal} vectors.")
        else:
            print("[FAISS] Creating new index...")
            # CLIP produces 512D vectors, we use Inner Product (Cosine Similarity)
            self._index = faiss.IndexFlatIP(512)
            self._id_map = []

    def _save_index(self):
        faiss.write_index(self._index, self._INDEX_PATH)
        with open(self._ID_MAP_PATH, "w") as f:
            for _id in self._id_map:
                f.write(f"{_id}\n")

    def add_vector(self, db_id: str, vector: list[float]):
        """Add a single vector and save immediately (good enough for MVP)."""
        # Normalize vector for cosine similarity
        vec_np = np.array([vector], dtype=np.float32)
        faiss.normalize_L2(vec_np)
        
        self._index.add(vec_np)
        self._id_map.append(db_id)
        self._save_index()

    def search(self, query_vector: list[float], k: int = 20) -> list[dict]:
        """Search and return list of matched MongoDB IDs with scores."""
        if self._index.ntotal == 0:
            return []
            
        vec_np = np.array([query_vector], dtype=np.float32)
        faiss.normalize_L2(vec_np)
        
        scores, I = self._index.search(vec_np, min(k, self._index.ntotal))
        
        results = []
        for j, faiss_id in enumerate(I[0]):
            if faiss_id != -1 and faiss_id < len(self._id_map):
                results.append({
                    "db_id": self._id_map[faiss_id],
                    "score": float(scores[0][j])
                })
        return results
