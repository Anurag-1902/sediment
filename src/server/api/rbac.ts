import { TRPCError } from "@trpc/server";

export type OrgRole = "MANAGER" | "ADMIN" | "DEVELOPER" | "HR" | "ACCOUNTANT" | "FINANCE" | "EMPLOYEE";

export const ROLE_PERMISSIONS = {
  MANAGER: {
    canManageBilling: true,
    canManageMembers: true,
    canManageSlack: true,
    canManageProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canViewBilling: true,
    canChangeRoles: true,
  },
  ADMIN: {
    canManageBilling: false,
    canManageMembers: true,
    canManageSlack: true,
    canManageProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canViewBilling: false,
    canChangeRoles: false,
  },
  DEVELOPER: {
    canManageBilling: false,
    canManageMembers: false,
    canManageSlack: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewBilling: false,
    canChangeRoles: false,
  },
  HR: {
    canManageBilling: false,
    canManageMembers: false,
    canManageSlack: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: true,
    canViewBilling: false,
    canChangeRoles: false,
  },
  ACCOUNTANT: {
    canManageBilling: false,
    canManageMembers: false,
    canManageSlack: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewBilling: true,
    canChangeRoles: false,
  },
  FINANCE: {
    canManageBilling: false,
    canManageMembers: false,
    canManageSlack: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewBilling: true,
    canChangeRoles: false,
  },
  EMPLOYEE: {
    canManageBilling: false,
    canManageMembers: false,
    canManageSlack: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewBilling: false,
    canChangeRoles: false,
  },
} as const;

export function hasPermission(
  role: OrgRole,
  permission: keyof typeof ROLE_PERMISSIONS.MANAGER
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function requirePermission(
  role: OrgRole,
  permission: keyof typeof ROLE_PERMISSIONS.MANAGER
) {
  if (!hasPermission(role, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your role (${role}) does not have permission to perform this action.`,
    });
  }
}

export const ROLE_LABELS: Record<OrgRole, string> = {
  MANAGER: "Manager",
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  HR: "HR",
  ACCOUNTANT: "Accountant",
  FINANCE: "Finance",
  EMPLOYEE: "Employee",
};

export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  MANAGER: "Full access to everything including billing",
  ADMIN: "Manage projects and members, no billing access",
  DEVELOPER: "View own projects, submit updates",
  HR: "View all projects and members for reporting",
  ACCOUNTANT: "View billing details, no other access",
  FINANCE: "View billing details, no other access",
  EMPLOYEE: "Basic access to assigned projects",
};
