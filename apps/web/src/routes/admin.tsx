import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  component: () => <Outlet />,
  beforeLoad: async () => {
    await requireRole("admin");
  },
});
