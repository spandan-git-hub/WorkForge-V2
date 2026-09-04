import json
from pathlib import Path
from typing import Optional

_ROLE_REQUIREMENTS_CACHE: Optional[dict[str, dict[str, int]]] = None


def get_data_dir() -> Path:
    """Return absolute path to backend/data directory."""
    return Path(__file__).resolve().parents[2] / "data"


def load_role_requirements() -> dict[str, dict[str, int]]:
    """
    Read and cache role requirements from backend/data/role_requirements.json.
    Format: { "Frontend Developer": { "React": 4, "JavaScript": 5, ... }, ... }
    """
    global _ROLE_REQUIREMENTS_CACHE
    if _ROLE_REQUIREMENTS_CACHE is None:
        file_path = get_data_dir() / "role_requirements.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Role requirements file not found at: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            _ROLE_REQUIREMENTS_CACHE = json.load(f)
    return _ROLE_REQUIREMENTS_CACHE


def get_available_roles() -> list[str]:
    """Return sorted list of available target role names."""
    requirements = load_role_requirements()
    return sorted(requirements.keys())
