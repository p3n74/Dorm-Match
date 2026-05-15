import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { portalPathForRole, type AppRole } from "@/lib/session";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/login", throw: true });
    }

    const role = (session.data.user as { role?: AppRole }).role;
    if (!role) {
      throw redirect({ to: "/onboarding", throw: true });
    }

    throw redirect({ to: portalPathForRole(role), throw: true });
  },
});
