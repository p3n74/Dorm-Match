import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/tenant")({
  component: () => <Outlet />,
  beforeLoad: async () => {
    await requireRole("tenant");
  },
});
