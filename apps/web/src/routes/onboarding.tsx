import { Avatar, AvatarFallback } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { portalPathForRole, requireSession } from "@/lib/session";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  beforeLoad: async () => {
    await requireSession();
  },
});

function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useQuery(trpc.profile.me.queryOptions());
  const setRole = useMutation(trpc.profile.setRole.mutationOptions());

  const currentRole = profile.data?.user.role;

  if (currentRole === "admin") {
    void navigate({ to: "/admin" });
  } else if (currentRole === "dorm_owner") {
    void navigate({ to: "/landlord" });
  } else if (currentRole === "tenant" && profile.data?.profile) {
    void navigate({ to: "/tenant" });
  }

  const chooseRole = async (role: "tenant" | "dorm_owner") => {
    try {
      await setRole.mutateAsync({ role });
      toast.success(role === "tenant" ? "Tenant account ready" : "Landlord account created");
      await navigate({ to: portalPathForRole(role) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set role");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Badge className="mb-4">Pick your path</Badge>
      <h1 className="mb-3 text-4xl font-black tracking-tight md:text-6xl">Welcome to DormMatch</h1>
      <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
        Choose your community role. You can complete your profile and tune your matching preferences right after.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Avatar className="mb-3 size-14">
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
            <CardTitle>I am looking for a dorm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Search listings, request reservations, track payments, and leave reviews.
            </p>
            <Button className="w-full" onClick={() => chooseRole("tenant")} disabled={setRole.isPending}>
              Continue as Tenant
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Avatar className="mb-3 size-14">
              <AvatarFallback>DO</AvatarFallback>
            </Avatar>
            <CardTitle>I own or manage a dorm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Create listings, manage rooms, accept reservations, and record payments.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => chooseRole("dorm_owner")}
              disabled={setRole.isPending}
            >
              Continue as Landlord
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
