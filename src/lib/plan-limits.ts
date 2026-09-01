export const PLAN_LIMITS = {
  FREE: { maxProjects: 0, maxMembersPerProject: 0 },
  STARTER: { maxProjects: 3, maxMembersPerProject: 10 },
  PRO: { maxProjects: 3, maxMembersPerProject: 10 },
  BUSINESS: { maxProjects: Infinity, maxMembersPerProject: Infinity },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string | null | undefined) {
  if (!plan || !(plan in PLAN_LIMITS)) return PLAN_LIMITS.FREE;
  return PLAN_LIMITS[plan as PlanKey];
}
