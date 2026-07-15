import { Avatar, AvatarFallback } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { Label } from "@DormMatch/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, InlineLoader, MutationButton, PageLoader } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/tenant/")({
  component: TenantDashboard,
});

function TenantDashboard() {
  const profile = useQuery(trpc.profile.me.queryOptions());
  const notifications = useQuery(trpc.notifications.list.queryOptions());
  const upsert = useMutation(trpc.profile.upsertTenantProfile.mutationOptions());
  const [school, setSchool] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const saveProfile = async () => {
    if (!school.trim() && !yearLevel.trim() && !budgetRange.trim()) {
      toast.error("Add at least one profile detail before saving");
      return;
    }
    try {
      await upsert.mutateAsync({ school, yearLevel, budgetRange });
      toast.success("Profile saved");
      await profile.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    }
  };

  if (profile.isLoading) return <PageLoader label="Loading student hub..." />;

  return (
   <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {profile.isError && (
        <ErrorState
          title="Could not load your profile"
          description={profile.error.message}
          retry={() => void profile.refetch()}
        />
      )}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-blue-200 bg-[#DBEAFE] text-[#0F3D73]">
            <AvatarFallback>{profile.data?.user.name?.slice(0, 2).toUpperCase() ?? "ST"}</AvatarFallback>
          </Avatar>
          <div>
            <Badge className="mb-2 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] text-[#0F3D73]">Student Hub</Badge>
            <h1 className="text-4xl font-black tracking-tight text-[#1E293B]">Hey, {profile.data?.user.name ?? "student"}!</h1>
            <p className="text-[#64748B]">Tune your profile, discover dorms, and track your move-in flow.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/browse">
          <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Browse dorms</Button>
        </Link>
        <Link to="/tenant/payments">
  <Button
    variant="outline"
    className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE] hover:text-[#0F3D73]"
  >
    Payment History
  </Button>
</Link>
        <Link to="/tenant/reservations">
          <Button
            variant="outline"
            className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE] hover:text-[#0F3D73]">My reservations</Button>
        </Link>
      </div>

      <Card className="border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="font-semibold text-[#1E293B]">School</Label>
            <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University" />
          </div>
          <div>
            <Label>Year level</Label>
            <Input value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} />
          </div>
          <div>
            <Label>Budget range</Label>
            <Input value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} />
          </div>
          <MutationButton
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]" onClick={saveProfile} isPending={upsert.isPending} pendingLabel="Saving...">
            Save profile
          </MutationButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.isLoading && <InlineLoader label="Loading notifications..." />}
          {notifications.isError && (
            <ErrorState
              title="Could not load notifications"
              description={notifications.error.message}
              retry={() => void notifications.refetch()}
            />
          )}
          {notifications.data?.slice(0, 5).map((n) => (
            <p key={n.id} className={`text-sm ${ n.read ? "text-[#64748B]" : "text-[#1E293B]" }`}>
              <Badge
    variant={n.read ? "secondary" : "default"}
    className={
      n.read
        ? "mr-2 border border-[#BFDBFE] bg-[#EFF6FF] text-[#64748B]"
        : "mr-2 border border-[#BFDBFE] bg-[#DBEAFE] text-[#0F3D73]"
    }
  >
    {n.read ? "Read" : "New"}
  </Badge>
              {n.message}
            </p>
          ))}
          {notifications.data?.length === 0 && (
            <EmptyState
              title="No notifications yet"
              description="Reservation updates, payment events, and admin messages will show up here."
            />
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
