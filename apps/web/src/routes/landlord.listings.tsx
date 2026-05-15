import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { Label } from "@DormMatch/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmAction, EmptyState, ErrorState, InlineLoader, MutationButton, PageLoader } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/landlord/listings")({
  component: LandlordListingsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    dormId: (search.dormId as string) || "",
  }),
});

function LandlordListingsPage() {
  const { dormId } = Route.useSearch();
  const listings = useQuery(trpc.listings.myListings.queryOptions());
  const selectedId = dormId || listings.data?.[0]?.id || "";
  const listing = useQuery({
    ...trpc.listings.getById.queryOptions({ id: selectedId }),
    enabled: Boolean(selectedId),
  });
  const addRoom = useMutation(trpc.listings.addRoom.mutationOptions());
  const updateListing = useMutation(trpc.listings.update.mutationOptions());
  const addPhoto = useMutation(trpc.listings.addPhoto.mutationOptions());
  const submit = useMutation(trpc.listings.submitForApproval.mutationOptions());
  const amenities = useQuery(trpc.listings.listAmenities.queryOptions());
  const [monthlyRate, setMonthlyRate] = useState("3000");
  const [roomType, setRoomType] = useState<"single" | "double" | "bedspace">("single");
  const [description, setDescription] = useState("");
  const [houseRules, setHouseRules] = useState("");
  const [nearbySchool, setNearbySchool] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  if (listings.isLoading) return <PageLoader label="Loading your listings..." />;

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Badge className="mb-2">Listing lab</Badge>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">Manage Listings</h1>
      {listings.isError && (
        <ErrorState
          title="Could not load your listings"
          description={listings.error.message}
          retry={() => void listings.refetch()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your dorms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listings.data?.length === 0 && (
            <EmptyState
              title="No dorms to manage"
              description="Create a listing from the Owner Studio before adding rooms or submitting for approval."
            />
          )}
          {listings.data?.map((l) => (
            <p key={l.id} className="text-sm">
              {l.name} <Badge variant={l.listingStatus === "approved" ? "success" : "warning"}>{l.listingStatus}</Badge>
            </p>
          ))}
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>{listing.data?.name ?? "Listing"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.isLoading && <InlineLoader label="Loading listing details..." />}
            {listing.isError && (
              <ErrorState
                title="Could not load listing details"
                description={listing.error.message}
                retry={() => void listing.refetch()}
              />
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={listing.data?.description ?? "Describe the rooms, facilities, and nearby landmarks"}
                />
              </div>
              <div>
                <Label>House rules</Label>
                <Input
                  value={houseRules}
                  onChange={(event) => setHouseRules(event.target.value)}
                  placeholder={listing.data?.houseRules ?? "Curfew, guests, utilities, deposits..."}
                />
              </div>
              <div>
                <Label>Nearby school/workplace</Label>
                <Input
                  value={nearbySchool}
                  onChange={(event) => setNearbySchool(event.target.value)}
                  placeholder={listing.data?.nearbySchool ?? "University or landmark"}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Latitude</Label>
                  <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="14.5995" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="120.9842" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Amenities</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {amenities.isLoading && <InlineLoader label="Loading amenities..." />}
                  {amenities.data?.map((amenity) => (
                    <button
                      key={amenity.id}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-black transition ${
                        selectedAmenityIds.includes(amenity.id)
                          ? "border-white bg-white text-zinc-950"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-white"
                      }`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      {amenity.name}
                    </button>
                  ))}
                </div>
              </div>
              <MutationButton
                className="md:col-span-2"
                isPending={updateListing.isPending}
                pendingLabel="Saving listing..."
                onClick={async () => {
                  try {
                    await updateListing.mutateAsync({
                      id: selectedId,
                      description: description || undefined,
                      houseRules: houseRules || undefined,
                      nearbySchool: nearbySchool || undefined,
                      latitude: latitude ? Number(latitude) : undefined,
                      longitude: longitude ? Number(longitude) : undefined,
                      amenityIds: selectedAmenityIds.length > 0 ? selectedAmenityIds : undefined,
                    });
                    toast.success("Listing details saved");
                    await listing.refetch();
                    await listings.refetch();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to save listing details");
                  }
                }}
              >
                Save listing details
              </MutationButton>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <Label>Photo URL</Label>
                <Input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Caption</Label>
                <Input value={photoCaption} onChange={(event) => setPhotoCaption(event.target.value)} />
              </div>
              <div className="flex items-end">
                <MutationButton
                  isPending={addPhoto.isPending}
                  pendingLabel="Adding photo..."
                  onClick={async () => {
                    if (!photoUrl.trim()) {
                      toast.error("Photo URL is required");
                      return;
                    }
                    try {
                      await addPhoto.mutateAsync({
                        dormId: selectedId,
                        imageUrl: photoUrl,
                        caption: photoCaption || undefined,
                      });
                      toast.success("Photo added");
                      setPhotoUrl("");
                      setPhotoCaption("");
                      await listing.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to add photo");
                    }
                  }}
                >
                  Add photo
                </MutationButton>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {listing.data?.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src={photo.imageUrl} alt={photo.caption ?? "Dorm photo"} className="h-36 w-full object-cover" />
                  {photo.caption && <p className="p-3 text-sm text-muted-foreground">{photo.caption}</p>}
                </div>
              ))}
              {listing.data?.photos.length === 0 && (
                <EmptyState
                  title="No photos yet"
                  description="Add at least one photo before submitting this listing for approval."
                />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Room type</Label>
                <select
                  className="h-11 w-full rounded-full border border-input bg-background/70 px-4 py-2 text-sm font-medium"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as typeof roomType)}
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="bedspace">Bedspace</option>
                </select>
              </div>
              <div>
                <Label>Monthly rate (₱)</Label>
                <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <MutationButton
                  isPending={addRoom.isPending}
                  pendingLabel="Adding..."
                  onClick={async () => {
                    if (!monthlyRate || Number(monthlyRate) <= 0) {
                      toast.error("Enter a valid monthly rate");
                      return;
                    }
                    try {
                      await addRoom.mutateAsync({
                        dormId: selectedId,
                        roomType,
                        monthlyRate: Number(monthlyRate),
                      });
                      toast.success("Room added");
                      await listing.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to add room");
                    }
                  }}
                >
                  Add room
                </MutationButton>
              </div>
            </div>
            <ConfirmAction
              title="Submit this listing for approval?"
              description="Admins will review the listing before it becomes visible to tenants."
              confirmLabel="Submit listing"
              isPending={submit.isPending}
              trigger={<Button variant="outline">Submit for approval</Button>}
              onConfirm={async () => {
                try {
                  await submit.mutateAsync({ id: selectedId });
                  toast.success("Submitted for admin approval");
                  await listings.refetch();
                  await listing.refetch();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Submit failed");
                }
              }}
            />
            <div>
              <p className="mb-2 font-medium">Rooms</p>
              {listing.data?.rooms.length === 0 && (
                <EmptyState
                  title="No rooms yet"
                  description="Add at least one room before submitting this listing for approval."
                />
              )}
              {listing.data?.rooms.map((r) => (
                <p key={r.id} className="text-sm capitalize">
                  {r.roomType} — ₱{r.monthlyRate} <Badge variant={r.availabilityStatus === "available" ? "success" : "warning"}>{r.availabilityStatus}</Badge>
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
