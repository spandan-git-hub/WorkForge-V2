import json
from pathlib import Path
from typing import Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.data_loader import get_data_dir


class ResourceSuggester:
    """
    ML-powered resource suggester that maps technical skills to curated learning resources
    (courses, documentation, videos, tutorials, and books) using exact lookup and
    character-level TF-IDF n-gram cosine similarity for typo and fuzzy matching.
    """

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or (get_data_dir() / "skill_resources.json")
        if not self.data_path.exists():
            raise FileNotFoundError(f"Skill resources file not found at: {self.data_path}")

        with open(self.data_path, "r", encoding="utf-8") as f:
            self.resources_db: dict[str, list[dict[str, Any]]] = json.load(f)

        self.skill_names: list[str] = list(self.resources_db.keys())

        # Build TF-IDF index for skill name matching (handles partial/fuzzy matches & typos)
        self.vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
        self.skill_matrix = self.vectorizer.fit_transform(self.skill_names)

    def suggest(self, skill_name: str, top_n: int = 6) -> list[dict[str, Any]]:
        """
        Suggest top learning resources for a skill name.
        Uses exact case-insensitive match first; falls back to TF-IDF cosine similarity.
        """
        skill_name_clean = skill_name.strip()
        if not skill_name_clean:
            return []

        lower_query = skill_name_clean.lower()

        # 1. Exact case-insensitive match
        for name, resources in self.resources_db.items():
            if name.lower() == lower_query:
                return self._score_and_sort(resources, top_n)

        # 2. Fuzzy match via TF-IDF cosine similarity
        query_vec = self.vectorizer.transform([lower_query])
        similarities = cosine_similarity(query_vec, self.skill_matrix)[0]
        best_idx = int(np.argmax(similarities))

        # Threshold 0.3 ensures sensible fuzzy matching while avoiding false positives
        if similarities[best_idx] > 0.3:
            best_skill = self.skill_names[best_idx]
            return self._score_and_sort(self.resources_db[best_skill], top_n)

        # No suitable match found
        return []

    def get_canonical_skill_name(self, skill_name: str) -> Optional[str]:
        """Return the canonical matched skill name in the dataset or None if unmapped."""
        skill_name_clean = skill_name.strip()
        if not skill_name_clean:
            return None

        lower_query = skill_name_clean.lower()
        for name in self.resources_db.keys():
            if name.lower() == lower_query:
                return name

        query_vec = self.vectorizer.transform([lower_query])
        similarities = cosine_similarity(query_vec, self.skill_matrix)[0]
        best_idx = int(np.argmax(similarities))

        if similarities[best_idx] > 0.3:
            return self.skill_names[best_idx]

        return None

    def _score_and_sort(self, resources: list[dict[str, Any]], top_n: int) -> list[dict[str, Any]]:
        """
        Score and prioritize resources:
        Type priority: course > video/interactive/tutorial > documentation > book > other
        """
        type_rank = {
            "course": 1,
            "video": 2,
            "interactive": 2,
            "tutorial": 2,
            "article": 3,
            "documentation": 4,
            "book": 5,
        }
        scored = [
            {**r, "_rank": type_rank.get(r.get("type", "article").lower(), 6)}
            for r in resources
        ]
        scored.sort(key=lambda x: x["_rank"])
        return [{k: v for k, v in r.items() if k != "_rank"} for r in scored[:top_n]]


# Singleton instance for application use
resource_suggester = ResourceSuggester()
