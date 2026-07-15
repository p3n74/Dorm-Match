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

export const Route = createFileRoute("/landlord/")({
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const profile = useQuery(trpc.profile.me.queryOptions());
  const listings = useQuery(trpc.listings.myListings.queryOptions());
  const inbox = useQuery(trpc.reservations.landlordInbox.queryOptions());
  const upsert = useMutation(trpc.profile.upsertLandlordProfile.mutationOptions());
  const createListing = useMutation(trpc.listings.create.mutationOptions());
  const [businessName, setBusinessName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const saveProfile = async () => {
    if (!businessName.trim() && !contactNumber.trim()) {
      toast.error("Add a business name or contact number before saving");
      return;
    }
    try {
      await upsert.mutateAsync({ businessName, contactNumber });
      toast.success("Profile saved");
      await profile.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  };

  const createDorm = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error("Listing name and address are required");
      return;
    }
    try {
      await createListing.mutateAsync({ name, address });
      toast.success("Listing created as draft");
      setName("");
      setAddress("");
      await listings.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create listing");
    }
  };

  if (profile.isLoading) return <PageLoader label="Loading owner studio..." />;

  const verification =
    profile.data?.profile && "verificationStatus" in profile.data.profile
      ? profile.data.profile.verificationStatus
      : undefined;

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {profile.isError && (
        <ErrorState
          title="Could not load landlord profile"
          description={profile.error.message}
          retry={() => void profile.refetch()}
        />
      )}
     <div className="flex items-center gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60">
      <Avatar className="size-16 bg-[#DBEAFE]">
  <AvatarFallback className="bg-[#DBEAFE] font-bold text-[#0F3D73]">
    LO
  </AvatarFallback>
</Avatar>
        <div>
          <Badge
  variant={verification === "approved" ? "success" : "warning"}
  className="mb-2 rounded-full px-4 py-1">
            {verification ?? "pending"} verification
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-[#1E293B]">Owner Studio</h1>
          <p className="text-[#64748B]">Create standout listings and move reservations through faster.</p>
        </div>
      </div>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Business profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="font-semibold text-[#1E293B]">Business name</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <Label className="font-semibold text-[#1E293B]">Contact number</Label>
            <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </div>
          <MutationButton
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
  onClick={saveProfile} isPending={upsert.isPending} pendingLabel="Saving...">
            Save profile
          </MutationButton>
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Create listing (draft)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="font-semibold text-[#1E293B]">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="font-semibold text-[#1E293B]">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <MutationButton
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            onClick={createDorm}
            disabled={verification !== "approved"}
            isPending={createListing.isPending}
            pendingLabel="Creating..."
          >
            Create draft
          </MutationButton>
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">My listings ({listings.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listings.isLoading && <InlineLoader label="Loading listings..." />}
          {listings.isError && (
            <ErrorState
              title="Could not load listings"
              description={listings.error.message}
              retry={() => void listings.refetch()}
            />
          )}
          {listings.data?.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-blue-100 py-3">
              <div>
                <p className="font-semibold text-[#1E293B]">{l.name}</p>
                <Badge
  variant={l.listingStatus === "approved" ? "success" : "warning"}
>
  {l.listingStatus || "No Status"}
</Badge>
              </div>
              <Link to="/landlord/listings" search={{ dormId: l.id }}>
               <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE] hover:text-[#0F3D73]"
>
                  Manage
                </Button>
              </Link>
            </div>
          ))}
          {listings.data?.length === 0 && (
            <EmptyState
              title="No listings yet"
              description="Once your landlord profile is verified, create your first dorm draft here."
            />
          )}
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Reservation inbox ({inbox.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {inbox.isLoading && <InlineLoader label="Loading inbox count..." />}
          {inbox.isError && (
            <ErrorState
              title="Could not load reservation inbox"
              description={inbox.error.message}
              retry={() => void inbox.refetch()}
            />
          )}
          <Link to="/landlord/reservations">
            <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>View reservations</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
