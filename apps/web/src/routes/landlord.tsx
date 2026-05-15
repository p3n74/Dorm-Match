import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/landlord")({
  component: () => <Outlet />,
  beforeLoad: async () => {
    await requireRole("dorm_owner");
  },
});
