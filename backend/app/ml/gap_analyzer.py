from typing import Any
from app.ml.data_loader import load_role_requirements


class GapAnalyzer:
    def __init__(self) -> None:
        self.role_requirements = load_role_requirements()

    def reload(self) -> None:
        """Reload requirements if updated."""
        self.role_requirements = load_role_requirements()

    def analyze(self, user_skills: dict[str, int], target_role: str) -> list[dict[str, Any]]:
        """
        Analyze gaps between user's current skills and requirements for a target role.

        user_skills: { "Python": 4, "React": 2, ... }
        target_role: e.g. "Frontend Developer"

        Returns: sorted list of gap dicts with keys:
          - skill: str
          - current: int
          - required: int
          - gap_magnitude: int
          - severity: "High" | "Medium" | "Low"
        """
        requirements = self.role_requirements.get(target_role, {})
        if not requirements:
            return []

        # Create normalized lowercase lookup for resilience
        user_skills_lower = {k.strip().lower(): v for k, v in user_skills.items()}

        gaps: list[dict[str, Any]] = []
        for skill, required_level in requirements.items():
            # Exact match first, then lowercase match
            if skill in user_skills:
                current_level = user_skills[skill]
            else:
                current_level = user_skills_lower.get(skill.strip().lower(), 0)

            gap_magnitude = max(0, required_level - current_level)
            if gap_magnitude > 0:
                if gap_magnitude >= 3:
                    severity = "High"
                elif gap_magnitude == 2:
                    severity = "Medium"
                else:
                    severity = "Low"

                gaps.append(
                    {
                        "skill": skill,
                        "current": current_level,
                        "required": required_level,
                        "gap_magnitude": gap_magnitude,
                        "severity": severity,
                    }
                )

        # Sort: High severity first, then by gap_magnitude descending, then alphabetical by skill
        severity_order = {"High": 0, "Medium": 1, "Low": 2}
        gaps.sort(
            key=lambda x: (
                severity_order.get(x["severity"], 3),
                -x["gap_magnitude"],
                x["skill"],
            )
        )

        return gaps


gap_analyzer = GapAnalyzer()
