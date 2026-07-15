import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ConfirmAction, EmptyState, ErrorState, InlineLoader, MutationButton } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const reports = useQuery(trpc.admin.reports.queryOptions());
  const pendingLandlords = useQuery(trpc.admin.pendingLandlords.queryOptions());
  const pendingListings = useQuery(trpc.listings.pendingApprovals.queryOptions());
  const complaints = useQuery(trpc.complaints.all.queryOptions());
  const verify = useMutation(trpc.admin.verifyLandlord.mutationOptions());
  const moderate = useMutation(trpc.listings.moderate.mutationOptions());
  const resolve = useMutation(trpc.complaints.resolve.mutationOptions());
  const seedAmenities = useMutation(trpc.listings.seedAmenities.mutationOptions());

  return (
   <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Badge className="mb-3 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">
  Control Room
</Badge>
      <h1 className="text-4xl font-black tracking-tight text-[#1E293B] md:text-5xl">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">Users</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-4xl font-black text-[#2563EB]">{reports.data?.users ?? "—"}</CardContent>
        </Card>
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">Listings</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-4xl font-black text-[#2563EB]">
  {reports.data?.approvedListings ?? "—"} approved / {reports.data?.listings ?? "—"} total
</CardContent>
        </Card>
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">Open Complaints</CardTitle>
          </CardHeader>
         <CardContent className="text-center text-4xl font-black text-[#2563EB]">
  {reports.data?.openComplaints ?? "—"}
</CardContent>
        </Card>
      </div>
     
      {reports.isError && (
        <ErrorState
          title="Could not load report metrics"
          description={reports.error.message}
          retry={() => void reports.refetch()}
        />
      )}

      <MutationButton
  variant="outline"
  className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
        isPending={seedAmenities.isPending}
        pendingLabel="Seeding..."
        onClick={async () => {
          try {
            await seedAmenities.mutateAsync();
            toast.success("Default amenities seeded");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not seed amenities");
          }
        }}
      >
        Seed default amenities
      </MutationButton>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">
  Pending Landlord Verifications
</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingLandlords.isLoading && <InlineLoader label="Loading landlord queue..." />}
          {pendingLandlords.isError && (
            <ErrorState
              title="Could not load landlord verifications"
              description={pendingLandlords.error.message}
              retry={() => void pendingLandlords.refetch()}
            />
          )}
          {pendingLandlords.data?.length === 0 && (
            <EmptyState
              title="No landlord verifications pending"
              description="New landlord verification requests will appear here."
            />
          )}
          {pendingLandlords.data?.map((p) => (
            <div
  key={p.id}
  className="flex items-center justify-between border-b border-blue-100 py-3">
              <span className="font-bold text-[#1E293B]">{p.businessName ?? p.id}</span>
              <Badge
  variant="warning"
  className="min-w-[90px] justify-center"
>
  Pending
</Badge>
              <div className="flex gap-2">
                <Button
  size="sm"
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  disabled={verify.isPending}
                  onClick={async () => {
                    try {
                      await verify.mutateAsync({ profileId: p.id, status: "approved" });
                      toast.success("Approved");
                      await pendingLandlords.refetch();
                      await reports.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Approval failed");
                    }
                  }}
                >
                  {verify.isPending ? "Approving..." : "Approve"}
                </Button>
                <ConfirmAction
                  title="Reject this landlord?"
                  description="The owner will be notified and will not be able to publish listings until verified."
                  confirmLabel="Reject landlord"
                  destructive
                  isPending={verify.isPending}
                  trigger={
                    <Button size="sm" variant="destructive">
                      Reject
                    </Button>
                  }
                  onConfirm={async () => {
                    try {
                      await verify.mutateAsync({ profileId: p.id, status: "rejected" });
                      toast.success("Rejected");
                      await pendingLandlords.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Rejection failed");
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">
  Pending Listings
</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingListings.isLoading && <InlineLoader label="Loading listing queue..." />}
          {pendingListings.isError && (
            <ErrorState
              title="Could not load pending listings"
              description={pendingListings.error.message}
              retry={() => void pendingListings.refetch()}
            />
          )}
          {pendingListings.data?.length === 0 && (
            <EmptyState
              title="No listings pending review"
              description="Submitted dorm listings will appear here for approval."
            />
          )}
          {pendingListings.data?.map((l) => (
            <div
  key={l.id}
  className="flex items-center justify-between border-b border-blue-100 py-3"
>
              <span className="font-bold text-[#1E293B]">{l.name}</span>
              <Badge
  variant="warning"
  className="min-w-[90px] justify-center"
>
  Needs Review
</Badge>
              <div className="flex gap-2">
                <Button
  size="sm"
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  disabled={moderate.isPending}
                  onClick={async () => {
                    try {
                      await moderate.mutateAsync({ id: l.id, status: "approved" });
                      toast.success("Listing approved");
                      await pendingListings.refetch();
                      await reports.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Approval failed");
                    }
                  }}
                >
                  {moderate.isPending ? "Approving..." : "Approve"}
                </Button>
                <ConfirmAction
                  title="Reject this listing?"
                  description="The landlord will be notified and can revise before resubmitting."
                  confirmLabel="Reject listing"
                  destructive
                  isPending={moderate.isPending}
                  trigger={
                    <Button size="sm" variant="destructive">
                      Reject
                    </Button>
                  }
                  onConfirm={async () => {
                    try {
                      await moderate.mutateAsync({ id: l.id, status: "rejected" });
                      toast.success("Listing rejected");
                      await pendingListings.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Rejection failed");
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">
  Complaints
</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {complaints.isLoading && <InlineLoader label="Loading complaints..." />}
          {complaints.isError && (
            <ErrorState
              title="Could not load complaints"
              description={complaints.error.message}
              retry={() => void complaints.refetch()}
            />
          )}
          {complaints.data?.length === 0 && (
            <EmptyState
              title="No complaints yet"
              description="Reported listings, users, and reservations will appear here."
            />
          )}
          {complaints.data?.map((c) => (
            <div
  key={c.id}
  className="border-b border-blue-100 py-3"
>
              <p className="text-sm text-[#1E293B]">{c.description}</p>
              <Badge variant={c.status === "open" ? "destructive" : "success"}>{c.status}</Badge>
              {c.status === "open" && (
                <div className="mt-2 flex gap-2">
                  <Button
    size="sm"
    className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                    disabled={resolve.isPending}
                    onClick={async () => {
                      try {
                        await resolve.mutateAsync({ id: c.id, status: "resolved" });
                        toast.success("Complaint resolved");
                        await complaints.refetch();
                        await reports.refetch();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Resolve failed");
                      }
                    }}
                  >
                    {resolve.isPending ? "Resolving..." : "Resolve"}
                  </Button>
                  <ConfirmAction
                    title="Dismiss this complaint?"
                    description="This marks the report as dismissed and records the admin resolution."
                    confirmLabel="Dismiss complaint"
                    isPending={resolve.isPending}
                    trigger={
                      <Button
    size="sm"
    variant="outline"
    className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>
                        Dismiss
                      </Button>
                    }
                    onConfirm={async () => {
                      try {
                        await resolve.mutateAsync({ id: c.id, status: "dismissed" });
                        toast.success("Complaint dismissed");
                        await complaints.refetch();
                        await reports.refetch();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Dismiss failed");
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
     </div>
  );
}
