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
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {profile.isError && (
        <ErrorState
          title="Could not load landlord profile"
          description={profile.error.message}
          retry={() => void profile.refetch()}
        />
      )}
      <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
        <Avatar className="size-16">
          <AvatarFallback>LO</AvatarFallback>
        </Avatar>
        <div>
          <Badge variant={verification === "approved" ? "success" : "warning"} className="mb-2">
            {verification ?? "pending"} verification
          </Badge>
          <h1 className="text-4xl font-black tracking-tight">Owner Studio</h1>
          <p className="text-muted-foreground">Create standout listings and move reservations through faster.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Business name</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <Label>Contact number</Label>
            <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </div>
          <MutationButton onClick={saveProfile} isPending={upsert.isPending} pendingLabel="Saving...">
            Save profile
          </MutationButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create listing (draft)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <MutationButton
            onClick={createDorm}
            disabled={verification !== "approved"}
            isPending={createListing.isPending}
            pendingLabel="Creating..."
          >
            Create draft
          </MutationButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My listings ({listings.data?.length ?? 0})</CardTitle>
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
            <div key={l.id} className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="font-medium">{l.name}</p>
                <Badge variant={l.listingStatus === "approved" ? "success" : "warning"}>{l.listingStatus}</Badge>
              </div>
              <Link to="/landlord/listings" search={{ dormId: l.id }}>
                <Button size="sm" variant="outline">
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

      <Card>
        <CardHeader>
          <CardTitle>Reservation inbox ({inbox.data?.length ?? 0})</CardTitle>
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
            <Button variant="outline">View reservations</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
