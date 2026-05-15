import { redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export type AppRole = "tenant" | "dorm_owner" | "admin";

export async function requireSession() {
  const session = await authClient.getSession();
  if (!session.data) {
    throw redirect({ to: "/login", throw: true });
  }
  return session.data;
}

export async function requireRole(...roles: AppRole[]) {
  const session = await requireSession();
  const role = (session.user as { role?: AppRole }).role;

  if (!role || !roles.includes(role)) {
    throw redirect({ to: "/onboarding", throw: true });
  }

  return { session, role };
}

export function portalPathForRole(role: AppRole) {
  switch (role) {
    case "tenant":
      return "/tenant";
    case "dorm_owner":
      return "/landlord";
    case "admin":
      return "/admin";
    default:
      return "/onboarding";
  }
}
