import { Avatar, AvatarFallback, AvatarImage } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { Label } from "@DormMatch/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@DormMatch/ui/components/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, InlineLoader, MutationButton } from "@/components/feedback";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const COMPARE_KEY = "dormmatch-compare";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [query, setQuery] = useState("");
  const [nearbySchool, setNearbySchool] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomType, setRoomType] = useState<"all" | "single" | "double" | "bedspace">("all");
  const [availabilityStatus, setAvailabilityStatus] = useState<"all" | "available" | "reserved" | "occupied">("available");
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"roommates" | "dorms">("roommates");
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const search = useQuery(
    trpc.search.dorms.queryOptions({
      query: query || undefined,
      nearbySchool: nearbySchool || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      roomType: roomType === "all" ? undefined : roomType,
      availabilityStatus: availabilityStatus === "all" ? undefined : availabilityStatus,
      amenityIds: amenityIds.length > 0 ? amenityIds : undefined,
    }),
  );
  const roommates = useQuery(trpc.search.roommates.queryOptions());
  const savedChats = useQuery({
    ...trpc.chat.myRoommateChats.queryOptions(),
    enabled: Boolean(session.data),
  });
  const amenities = useQuery(trpc.listings.listAmenities.queryOptions());
  const startChat = useMutation(trpc.chat.startRoommateChat.mutationOptions());

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 4);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setNearbySchool("");
    setMinPrice("");
    setMaxPrice("");
    setRoomType("all");
    setAvailabilityStatus("available");
    setAmenityIds([]);
  };

  const toggleAmenity = (id: string) => {
    setAmenityIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const openRoommateChat = async (roommate: NonNullable<typeof roommates.data>[number]) => {
    if (!session.data) {
      toast.error("Sign in to start a roommate chat");
      await navigate({ to: "/login" });
      return;
    }

    try {
      const conversation = await startChat.mutateAsync({
        roommateKey: roommate.key,
        roommateName: roommate.name,
        roommateSchool: roommate.school === "Student" ? undefined : roommate.school,
      });
      await navigate({
        to: "/roommate-chat/$conversationId",
        params: { conversationId: conversation.id },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start chat");
    }
  };

  return (
  <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <Badge className="mb-4">Verified student stays</Badge>
          <h1 className="text-4xl font-black tracking-tight text-[#1E293B] md:text-6xl">Find a room that fits your daily life.</h1>
          <p className="mt-4 text-lg text-[#1E293B]">
            Compare student housing, review room options, and connect with potential roommates before you book.
          </p>
        </div>
        {compareIds.length > 0 && (
          <Link to="/compare">
            <Button variant="outline">Compare picks ({compareIds.length})</Button>
          </Link>
        )}
      </div>

      <Tabs>
        <TabsList className="mb-8">
          <TabsTrigger active={activeTab === "roommates"} onClick={() => setActiveTab("roommates")}>
            Find Roommates
          </TabsTrigger>
          <TabsTrigger active={activeTab === "dorms"} onClick={() => setActiveTab("dorms")}>
            Browse Dorms
          </TabsTrigger>
        </TabsList>

        <TabsContent active={activeTab === "roommates"}>
          {session.data && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Saved roommate chats</CardTitle>
              </CardHeader>
              <CardContent>
                {savedChats.isLoading && <InlineLoader label="Loading saved chats..." />}
                {savedChats.isError && (
                  <ErrorState
                    title="Saved chats failed to load"
                    description={savedChats.error.message}
                    retry={() => void savedChats.refetch()}
                  />
                )}
                {!savedChats.isLoading && !savedChats.isError && savedChats.data?.length === 0 && (
                  <p className="text-sm text-[#1E293B]">
                    Start a roommate chat below and it will stay here for both students.
                  </p>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {savedChats.data?.map((chat) => (
                    <Link
                      key={chat.id}
                      to="/roommate-chat/$conversationId"
                      params={{ conversationId: chat.id }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25 hover:bg-white/10"
                    >
                      <p className="font-black">{chat.roommate.name}</p>
                      <p className="text-sm text-[#1E293B]">
                        {chat.latestMessage?.body ??
                          (chat.roommate.school ? `${chat.roommate.school} student` : "Roommate conversation")}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {roommates.isLoading && <InlineLoader label="Loading roommate profiles..." />}
          {roommates.isError && (
            <ErrorState
              title="Roommate search failed"
              description={roommates.error.message}
              retry={() => void roommates.refetch()}
            />
          )}
          {!roommates.isLoading && !roommates.isError && roommates.data?.length === 0 && (
            <EmptyState
              title="No roommate profiles yet"
              description="New tenant accounts will appear here after they sign up. Ask students to complete their tenant profile for better matches."
            />
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {roommates.data?.map((roommate) => (
              <Card key={roommate.key} className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-14">
                      {roommate.image && <AvatarImage src={roommate.image} alt={roommate.name} />}
                      <AvatarFallback>{roommate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{roommate.name}</CardTitle>
                      <p className="text-sm text-[#1E293B]">
                        {roommate.school === "Student" ? "Student" : `${roommate.school} student`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">{roommate.yearLevel ?? "Tenant profile"}</Badge>
                    <Badge variant="cyan">{roommate.budgetRange}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roommate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <MutationButton
                    className="w-full"
                    isPending={startChat.isPending}
                    pendingLabel="Opening chat..."
                    onClick={() => void openRoommateChat(roommate)}
                  >
                    Start roommate chat
                  </MutationButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent active={activeTab === "dorms"}>
          <Card className="mb-6">
            <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
              <div>
                <Label>Search</Label>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or address" />
              </div>
              <div>
                <Label>Nearby school</Label>
                <Input value={nearbySchool} onChange={(e) => setNearbySchool(e.target.value)} />
              </div>
              <div>
                <Label>Min price</Label>
                <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div>
                <Label>Max price</Label>
                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
              <div>
                <Label>Room type</Label>
                <select
                 className="h-11 w-full rounded-full border border-blue-200 bg-[#DCEBFA] px-4 py-2 text-sm font-medium text-[#1E293B]"
                  value={roomType}
                  onChange={(event) => setRoomType(event.target.value as typeof roomType)}
                >
                  <option value="all">Any type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="bedspace">Bedspace</option>
                </select>
              </div>
              <div>
                <Label>Availability</Label>
                <select
                 className="h-11 w-full rounded-full border border-blue-200 bg-[#DCEBFA] px-4 py-2 text-sm font-medium text-[#1E293B]"
                  value={availabilityStatus}
                  onChange={(event) => setAvailabilityStatus(event.target.value as typeof availabilityStatus)}
                >
                  <option value="available">Available now</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="all">Any status</option>
                </select>
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
                      amenityIds.includes(amenity.id)
                       ? "border-[#08284D] bg-[#08284D] text-white"
                       : "border-blue-300 bg-[#DCEBFA] text-[#1E293B] hover:bg-[#08284D] hover:text-white"
                        }`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      {amenity.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {search.isLoading && <InlineLoader label="Loading listings..." />}
          {search.isError && (
            <ErrorState
              title="Dorm search failed"
              description={search.error.message}
              retry={() => void search.refetch()}
            />
          )}
          {!search.isLoading && !search.isError && search.data?.length === 0 && (
            <EmptyState
              title="No dorms match those filters"
              description="Try widening your budget, clearing the school filter, or checking back after more listings are approved."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {search.data?.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{listing.name}</span>
                    <Badge variant="pink">
                      ₱{listing.minRate}
                      {listing.minRate !== listing.maxRate ? ` - ₱${listing.maxRate}` : ""}/mo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[#1E293B]">{listing.address}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="cyan">{listing.rooms.length} room option(s)</Badge>
                    {listing.nearbySchool && <Badge variant="secondary">Near {listing.nearbySchool}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/dorms/$dormId" params={{ dormId: listing.id }}>
                      <Button size="sm">View details</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => toggleCompare(listing.id)}>
                      {compareIds.includes(listing.id) ? "Remove compare" : "Compare"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
