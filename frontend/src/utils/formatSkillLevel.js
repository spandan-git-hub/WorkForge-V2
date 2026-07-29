/**
 * Map numeric proficiency level (1-5) to a human-readable label.
 * @param {number} level
 * @returns {string}
 */
export function formatSkillLevel(level) {
  const labels = {
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  }
  return labels[level] || 'Unknown'
}
