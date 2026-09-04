import csv
import json
import random
from pathlib import Path
import numpy as np

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def generate_profiles(n_samples: int = 5000, seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)

    # 1. Load skill catalog and role requirements
    with open(DATA_DIR / "skill_catalog.json", "r", encoding="utf-8") as f:
        skill_catalog = json.load(f)
    all_skills = [s["name"] for s in skill_catalog]

    with open(DATA_DIR / "role_requirements.json", "r", encoding="utf-8") as f:
        role_requirements = json.load(f)
    roles = list(role_requirements.keys())

    seniority_levels = [
        ("Junior", (0.5, 2.0), 0.55),
        ("Mid", (2.0, 5.0), 0.75),
        ("Senior", (5.0, 10.0), 0.90),
        ("Lead", (8.0, 16.0), 0.96),
    ]

    profiles = []
    
    # Track co-occurrence
    cooccurrence = {s1: {s2: 0 for s2 in all_skills} for s1 in all_skills}

    for i in range(1, n_samples + 1):
        profile_id = f"DEV_{i:05d}"
        role = random.choice(roles)
        seniority, exp_range, readiness_target = random.choice(seniority_levels)
        years_exp = round(random.uniform(*exp_range), 1)

        reqs = role_requirements[role]

        # Initialize all skills at 0
        user_skills = {skill: 0 for skill in all_skills}

        # 1. Fill required skills with distribution centered around seniority
        for skill, req_lvl in reqs.items():
            if skill not in user_skills:
                continue
            if seniority == "Junior":
                # Junior: gaps exist, typically 1 to req_lvl-1 or sometimes meet basic
                lvl = max(0, min(5, int(np.random.normal(req_lvl - 1.5, 1.0))))
            elif seniority == "Mid":
                lvl = max(1, min(5, int(np.random.normal(req_lvl - 0.5, 0.9))))
            elif seniority == "Senior":
                lvl = max(2, min(5, int(np.random.normal(req_lvl + 0.2, 0.7))))
            else:  # Lead
                lvl = max(3, min(5, int(np.random.normal(req_lvl + 0.6, 0.6))))
            user_skills[skill] = lvl

        # 2. Add random secondary skills (0 to 6 skills outside core requirements)
        num_extra = random.randint(1, 6)
        extra_candidates = [s for s in all_skills if s not in reqs]
        for extra in random.sample(extra_candidates, min(num_extra, len(extra_candidates))):
            user_skills[extra] = random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.2, 0.05])[0]

        # 3. Calculate true role readiness score (0.0 to 1.0)
        # Ratio of user proficiency vs required proficiency for target role
        total_req = sum(reqs.values())
        matched = sum(min(user_skills.get(s, 0), req_lvl) for s, req_lvl in reqs.items())
        readiness = round(min(1.0, max(0.05, (matched / total_req) + np.random.normal(0, 0.03))), 3)

        # 4. Update co-occurrence for all skills possessed (> 0)
        active_skills = [s for s, lvl in user_skills.items() if lvl > 0]
        for s1 in active_skills:
            for s2 in active_skills:
                if s1 != s2:
                    cooccurrence[s1][s2] += 1

        record = {
            "profile_id": profile_id,
            "target_role": role,
            "seniority": seniority,
            "years_experience": years_exp,
            "role_readiness": readiness,
            **user_skills
        }
        profiles.append(record)

    # Save CSV
    csv_path = DATA_DIR / "synthetic_profiles.csv"
    headers = ["profile_id", "target_role", "seniority", "years_experience", "role_readiness"] + all_skills
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(profiles)

    print(f"Generated {len(profiles)} synthetic profiles across {len(roles)} roles at {csv_path}")

    # Normalize co-occurrence matrix to probabilities/weights
    norm_cooccurrence = {}
    for s1, counts in cooccurrence.items():
        max_c = max(counts.values()) if counts and max(counts.values()) > 0 else 1
        norm_cooccurrence[s1] = {
            s2: round(c / max_c, 4) for s2, c in counts.items() if c > 0
        }

    cooc_path = DATA_DIR / "skill_cooccurrence.json"
    with open(cooc_path, "w", encoding="utf-8") as f:
        json.dump(norm_cooccurrence, f, indent=2)
    print(f"Generated normalized skill co-occurrence matrix at {cooc_path}")

if __name__ == "__main__":
    generate_profiles()
