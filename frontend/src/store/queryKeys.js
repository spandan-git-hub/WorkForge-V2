/**
 * TanStack Query key factories
 * Centralized query keys to avoid typos and ensure cache consistency.
 */

export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  profile: {
    detail: ['profile'],
  },
  skills: {
    all: ['skills'],
    catalog: ['skills', 'catalog'],
  },
  events: {
    all: (filters) => ['events', filters],
    detail: (id) => ['events', id],
  },
  ml: {
    roles: ['ml', 'roles'],
    gapAnalysis: ['ml', 'gap-analysis'],
    recommendations: ['ml', 'recommendations'],
    resources: (skill) => ['ml', 'resources', skill],
  },
  dashboard: {
    summary: ['dashboard'],
  },
}
