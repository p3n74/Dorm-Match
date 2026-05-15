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
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dorms/$dormId")({
  component: DormDetailPage,
});

function DormDetailPage() {
  const { dormId } = Route.useParams();
  const session = authClient.useSession();
  const listing = useQuery(trpc.listings.getById.queryOptions({ id: dormId }));
  const reviews = useQuery(trpc.reviews.byDorm.queryOptions({ dormId }));
  const [selectedRoom, setSelectedRoom] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const createReservation = useMutation(trpc.reservations.create.mutationOptions());

  const requestReservation = async () => {
    if (!selectedRoom || !moveInDate) {
      toast.error("Select a room and move-in date");
      return;
    }
    try {
      await createReservation.mutateAsync({
        roomId: selectedRoom,
        moveInDate: new Date(moveInDate),
      });
      toast.success("Reservation request submitted");
      setSelectedRoom("");
      setMoveInDate("");
      await listing.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request");
    }
  };

  if (listing.isLoading) return <PageLoader label="Loading dorm details..." />;
  if (listing.isError) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <ErrorState
          title="Could not load this dorm"
          description={listing.error.message}
          retry={() => void listing.refetch()}
          action={
            <Link to="/browse">
              <Button variant="outline">Back to browse</Button>
            </Link>
          }
        />
      </div>
    );
  }
  if (!listing.data) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <EmptyState
          title="Listing not found"
          description="This dorm may have been removed or is no longer available."
          action={
            <Link to="/browse">
              <Button>Browse dorms</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const data = listing.data;
  const availableRooms = data.rooms.filter((r) => r.availabilityStatus === "available");

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-4">Verified dorm</Badge>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">{data.name}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{data.address}</p>
            {data.nearbySchool && <Badge variant="cyan" className="mt-4">Near {data.nearbySchool}</Badge>}
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-background/50 p-2 pr-5">
            <Avatar>
              <AvatarFallback>LO</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-black">Landlord host</p>
              <p className="text-xs text-muted-foreground">Responsive and verified</p>
            </div>
          </div>
        </div>
      </div>

      {data.description && <p className="text-lg text-muted-foreground">{data.description}</p>}
      {data.photos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {data.photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
              <img src={photo.imageUrl} alt={photo.caption ?? data.name} className="h-48 w-full object-cover" />
              {photo.caption && <p className="p-3 text-sm text-muted-foreground">{photo.caption}</p>}
            </div>
          ))}
        </div>
      )}
      {(data.amenities.length > 0 || data.latitude || data.longitude) && (
        <Card>
          <CardHeader>
            <CardTitle>Location & Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((amenity) => (
                  <Badge key={amenity.id} variant="secondary">
                    {amenity.name}
                  </Badge>
                ))}
              </div>
            )}
            {data.latitude && data.longitude && (
              <p className="text-sm text-muted-foreground">
                Map coordinates: {data.latitude}, {data.longitude}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {data.houseRules && (
        <Card>
          <CardHeader>
            <CardTitle>House Rules</CardTitle>
          </CardHeader>
          <CardContent>{data.houseRules}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.rooms.length === 0 && (
            <EmptyState
              title="No rooms have been added"
              description="This listing is visible, but the owner has not added rentable room options yet."
            />
          )}
          {data.rooms.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <p className="font-medium capitalize">
                  {r.roomType} — ₱{r.monthlyRate}/mo
                </p>
                <Badge variant={r.availabilityStatus === "available" ? "success" : "warning"}>
                  {r.availabilityStatus}
                </Badge>
              </div>
              {session.data && r.availabilityStatus === "available" && (
                <Button size="sm" variant="outline" onClick={() => setSelectedRoom(r.id)}>
                  {selectedRoom === r.id ? "Selected" : "Select"}
                </Button>
              )}
            </div>
          ))}
          {data.rooms.length > 0 && availableRooms.length === 0 && (
            <EmptyState
              title="All rooms are currently taken"
              description="Check back later or compare nearby dorms with available rooms."
              action={
                <Link to="/browse">
                  <Button variant="outline">Find another dorm</Button>
                </Link>
              }
            />
          )}
          {!session.data && availableRooms.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-muted-foreground">Sign in to select a room and request a reservation.</p>
              <Link to="/login">
                <Button className="mt-3" size="sm">Sign in to reserve</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {session.data && selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Request Reservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Move-in date</Label>
              <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </div>
            <MutationButton
              onClick={requestReservation}
              isPending={createReservation.isPending}
              pendingLabel="Submitting..."
            >
              Submit request
            </MutationButton>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reviews.isLoading && <InlineLoader label="Loading reviews..." />}
          {reviews.isError && (
            <ErrorState
              title="Could not load reviews"
              description={reviews.error.message}
              retry={() => void reviews.refetch()}
            />
          )}
          {reviews.data?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {reviews.data?.map((r) => (
            <div key={r.id} className="flex gap-3 border-b border-white/10 pb-3">
              <Avatar className="size-9">
                <AvatarFallback>{r.rating}</AvatarFallback>
              </Avatar>
              <div>
              <p className="font-black">{r.rating}/5 stars</p>
              {r.comment && <p className="text-sm">{r.comment}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
