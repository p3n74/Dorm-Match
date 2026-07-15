import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { EmptyState, ErrorState, PageLoader } from "@/components/feedback";
import { trpc, trpcClient } from "@/utils/trpc";

const COMPARE_KEY = "dormmatch-compare";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const ids: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  })();

  const listings = useQuery({
    queryKey: ["compare", ids],
    queryFn: async () => Promise.all(ids.map((id) => trpcClient.listings.getById.query({ id }))),
    enabled: ids.length > 0,
  });

  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F9FF]">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <EmptyState
          title="No listings selected for comparison"
          description="Add dorms from the browse page to compare rates, amenities, and room options side by side."
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

  if (listings.isLoading) return <PageLoader label="Loading comparison board..." />;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Badge className="mb-4 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">
        Decision Board
        </Badge>
      <h1 className="mb-6 text-4xl font-black tracking-tight text-[#1E293B] md:text-5xl">Compare Listings</h1>
      {listings.isError && (
        <ErrorState
          title="Could not load comparison"
          description={listings.error.message}
          retry={() => void listings.refetch()}
          action={
            <Link to="/browse">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Back to browse</Button>
            </Link>
          }
        />
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.data?.map((listing) => {
          const rates = listing.rooms.map((r) => r.monthlyRate);
          return (
            <Card key={listing.id} className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
              <CardHeader>
                <CardTitle className="text-[#1E293B]"> {listing.name} </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#64748B]">
                <p className="text-[#64748B]"> {listing.address} </p>
                <Badge className="border border-[#BFDBFE] bg-[#DBEAFE] text-[#0F3D73]">
                  Rooms: {listing.rooms.length}
                  </Badge>
                <p className="font-semibold text-[#1E293B]">
                Rates: {rates.length > 0 ? `₱${Math.min(...rates)} - ₱${Math.max(...rates)}` : "No rooms yet"}
                </p>
                <p className="text-[#64748B]">
                Amenities: {listing.amenities.map((a) => a.name).join(", ") || "None"}
                </p>
                <Link to="/dorms/$dormId" params={{ dormId: listing.id }}>
                  <Button 
                  size="sm"
                className="mt-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    View details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
