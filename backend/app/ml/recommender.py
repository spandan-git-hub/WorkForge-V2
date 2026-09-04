from typing import Any
from app.ml.data_loader import load_role_requirements


class SkillRecommender:
    def __init__(self) -> None:
        self.role_requirements = load_role_requirements()

    def reload(self) -> None:
        """Reload role requirements from storage if updated."""
        self.role_requirements = load_role_requirements()

    def recommend(
        self,
        user_skills: dict[str, int],
        gaps: list[dict[str, Any]],
        top_n: int = 8,
    ) -> list[dict[str, Any]]:
        """
        Ranks gap skills by a weighted scoring algorithm:
          - Gap magnitude (weight 0.5): Urgency to satisfy immediate benchmark
          - Frequency across all roles (weight 0.3): How universal/market-transferable the skill is
          - Synergy with user's existing skills (weight 0.2): Co-occurrence in roles with current skills

        Returns:
          List of top_n recommended skills with keys:
          - skill: str
          - priority: int (1-indexed rank)
          - reason: str
          - score: float (0.0 to 1.0)
        """
        if not gaps:
            return []

        # 1. Build skill frequency map across all roles
        skill_freq: dict[str, int] = {}
        for role_skills in self.role_requirements.values():
            for skill in role_skills:
                skill_freq[skill] = skill_freq.get(skill, 0) + 1
        max_freq = max(skill_freq.values()) if skill_freq else 1

        # 2. Build synergy map (co-occurrence with user's current inventory)
        # Normalize keys for comparison
        user_skill_names = {s.strip().lower() for s in user_skills.keys()}
        skill_synergy: dict[str, int] = {}

        for role_skills in self.role_requirements.values():
            role_skills_set = set(role_skills.keys())
            role_skills_lower = {s.strip().lower() for s in role_skills_set}
            overlap = len(role_skills_lower & user_skill_names)
            if overlap > 0:
                for skill in role_skills_set:
                    skill_synergy[skill] = skill_synergy.get(skill, 0) + overlap

        # 3. Calculate scores for all gap skills
        results: list[dict[str, Any]] = []
        for gap in gaps:
            skill = gap["skill"]
            # Gap magnitude normalized (max realistic gap is 4 or 5)
            gap_score = min(gap.get("gap_magnitude", 1) / 4.0, 1.0)
            freq_score = skill_freq.get(skill, 0) / max_freq
            synergy_score = min(skill_synergy.get(skill, 0) / 10.0, 1.0)

            final_score = (
                0.5 * gap_score
                + 0.3 * freq_score
                + 0.2 * synergy_score
            )

            freq_count = skill_freq.get(skill, 0)
            reason = self._generate_reason(skill, gap, freq_count)

            results.append(
                {
                    "skill": skill,
                    "score": round(final_score, 4),
                    "reason": reason,
                }
            )

        # 4. Sort: highest score first, then alphabetical by skill
        results.sort(key=lambda x: (-x["score"], x["skill"]))

        # 5. Assign 1-indexed priority rank to top_n
        top_results = results[:top_n]
        for i, item in enumerate(top_results):
            item["priority"] = i + 1

        return top_results

    def _generate_reason(self, skill: str, gap: dict[str, Any], freq: int) -> str:
        severity_map = {
            "High": "a critical gap",
            "Medium": "a notable gap",
            "Low": "a small gap",
        }
        severity_text = severity_map.get(gap.get("severity", "Low"), "a gap")
        required_lvl = gap.get("required", 1)
        current_lvl = gap.get("current", 0)

        roles_text = f"It is required across {freq} tech tracks" if freq > 1 else "It is required for this career track"

        return (
            f"{skill} is {severity_text} for your target role "
            f"(target: level {required_lvl}, currently: level {current_lvl}). "
            f"{roles_text}, giving it strong immediate and long-term career value."
        )


recommender = SkillRecommender()
