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
    <div className="min-h-screen bg-[#F4F9FF]">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <ErrorState
          title="Could not load this dorm"
          description={listing.error.message}
          retry={() => void listing.refetch()}
          action={
            <Link to="/browse">
              <Button
  variant="outline"
  className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>Back to browse</Button>
            </Link>
          }
        />
      </div>
      </div>
    );
  }
  if (!listing.data) {
    return (
     <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-5xl px-4 py-8">
        <EmptyState
          title="Listing not found"
          description="This dorm may have been removed or is no longer available."
          action={
            <Link to="/browse">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Browse dorms</Button>
            </Link>
          }
        />
      </div>
      </div>
    );
  }

  const data = listing.data;
  const availableRooms = data.rooms.filter((r) => r.availabilityStatus === "available");

  return (
   <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
     <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-4 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">Verified dorm</Badge>
            <h1 className="text-4xl font-black tracking-tight text-[#1E293B] md:text-6xl">{data.name}</h1>
            <p className="mt-3 text-lg text-[#64748B]">{data.address}</p>
            {data.nearbySchool && <Badge className="mt-4 border border-[#BFDBFE] bg-[#DBEAFE] text-[#0F3D73]">Near {data.nearbySchool}</Badge>}
          </div>
          <div className="flex items-center gap-3 rounded-full border border-blue-100 bg-[#EFF6FF] p-2 pr-5">
            <Avatar className="bg-[#DBEAFE]">
  <AvatarFallback className="bg-[#DBEAFE] text-[#0F3D73] font-bold">
    LO
  </AvatarFallback>
</Avatar>
            <div>
              <p className="text-sm font-black text-[#1E293B]">Landlord host</p>
              <p className="text-xs text-[#64748B]">Responsive and verified</p>
            </div>
          </div>
        </div>
      </div>

      {data.description && <p className="text-lg text-[#64748B]">{data.description}</p>}
      {data.photos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {data.photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
              <img src={photo.imageUrl} alt={photo.caption ?? data.name} className="h-48 w-full object-cover" />
              {photo.caption && <p className="p-3 text-sm text-[#64748B]">{photo.caption}</p>}
            </div>
          ))}
        </div>
      )}
      {(data.amenities.length > 0 || data.latitude || data.longitude) && (
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">Location & Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((amenity) => (
                    <Badge
    key={amenity.id}
    className="border border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73]"
  >
    {amenity.name}
  </Badge>
))}
              </div>
            )}
            {data.latitude && data.longitude && (
              <p className="text-sm text-[#64748B]">
                Map coordinates: {data.latitude}, {data.longitude}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {data.houseRules && (
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">House Rules</CardTitle>
          </CardHeader>
         <CardContent className="text-[#64748B]">
  {data.houseRules}
</CardContent>
        </Card>
      )}

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.rooms.length === 0 && (
            <EmptyState
              title="No rooms have been added"
              description="This listing is visible, but the owner has not added rentable room options yet."
            />
          )}
          {data.rooms.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-blue-100 py-3">
              <div>
                <p className="font-semibold capitalize text-[#1E293B]">
                  {r.roomType} — ₱{r.monthlyRate}/mo
                </p>
                <Badge
  variant={
    r.availabilityStatus === "available"
      ? "success"
      : r.availabilityStatus === "reserved"
        ? "warning"
        : "destructive"
  }
>
  {r.availabilityStatus}
</Badge>
              </div>
              {session.data && r.availabilityStatus === "available" && (
                <Button
  size="sm"
  variant="outline"
  className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]" onClick={() => setSelectedRoom(r.id)}>
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
                  <Button
  variant="outline"
  className="border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>Find another dorm</Button>
                </Link>
              }
            />
          )}
          {!session.data && availableRooms.length > 0 && (
            <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF] p-4">
              <p className="text-sm font-semibold text-[#1E293B]">Sign in to select a room and request a reservation.</p>
              <Link to="/login">
                <Button className="mt-3 bg-[#2563EB] text-white hover:bg-[#1D4ED8]" size="sm">Sign in to reserve</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {session.data && selectedRoom && (
        <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <CardTitle className="text-[#1E293B]">Request Reservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-semibold text-[#1E293B]">
  Move-in date
</Label>
              <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </div>
            <MutationButton
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={requestReservation}
              isPending={createReservation.isPending}
              pendingLabel="Submitting..."
            >
              Submit request
            </MutationButton>
          </CardContent>
        </Card>
      )}

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Reviews</CardTitle>
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
          {reviews.data?.length === 0 && <p className="text-sm text-[#64748B]">No reviews yet.</p>}
          {reviews.data?.map((r) => (
            <div key={r.id} className="flex gap-3 border-b border-blue-100 py-3">
              <Avatar className="size-9 bg-[#DBEAFE]">
  <AvatarFallback className="bg-[#DBEAFE] text-[#0F3D73] font-bold">
    {r.rating}
  </AvatarFallback>
</Avatar>
              <div>
              <p className="font-black text-[#1E293B]">{r.rating}/5 stars</p>
              {r.comment && <p className="text-sm text-[#64748B]">{r.comment}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
