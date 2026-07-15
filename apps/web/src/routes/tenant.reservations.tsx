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

import { ConfirmAction, EmptyState, ErrorState, MutationButton, PageLoader } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/tenant/reservations")({
  component: TenantReservationsPage,
});

function TenantReservationsPage() {
  const reservations = useQuery(trpc.reservations.myReservations.queryOptions());
  const cancel = useMutation(trpc.reservations.cancel.mutationOptions());
  const createReview = useMutation(trpc.reviews.create.mutationOptions());
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (reservations.isLoading) return <PageLoader label="Loading your reservations..." />;

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Badge className="mb-3 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">
       Booking Timeline</Badge>
      <h1 className="text-4xl font-black tracking-tight text-[#1E293B] md:text-5xl">My Reservations</h1>
      {reservations.isError && (
        <ErrorState
          title="Could not load reservations"
          description={reservations.error.message}
          retry={() => void reservations.refetch()}
        />
      )}
      {reservations.data?.map((r) => (
        <Card
  key={r.id}
  className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="border border-blue-200 bg-[#DBEAFE] text-[#0F3D73]">
                <AvatarFallback>{r.status.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="capitalize text-[#1E293B]">Status: {r.status}</CardTitle>
             <Badge
  className={
    r.status === "confirmed" || r.status === "completed"
      ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
      : r.status === "pending"
      ? "border border-amber-200 bg-amber-100 text-amber-700"
      : r.status === "cancelled"
      ? "border border-red-200 bg-red-100 text-red-700"
      : "border border-slate-200 bg-slate-100 text-slate-700"
  }
>
  {r.status}
</Badge>
                
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#64748B]">Move-in: {new Date(r.moveInDate).toLocaleDateString()}</p>
            {["pending", "confirmed"].includes(r.status) && (
              <ConfirmAction
                title="Cancel this reservation?"
                description="This will notify the landlord and release the room if no other active request exists."
                confirmLabel="Cancel reservation"
                destructive
                isPending={cancel.isPending}
                trigger={
                  <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700">
                  Cancel
                  </Button>
                }
                onConfirm={async () => {
                  try {
                    await cancel.mutateAsync({ id: r.id, reason: "Changed plans" });
                    toast.success("Reservation cancelled");
                    await reservations.refetch();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Cancel failed");
                  }
                }}
              />
            )}
            {r.status === "completed" && (
              <div className="space-y-3 border-t border-blue-100 pt-4">
                <Label className="font-semibold text-[#1E293B]">Leave a review</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
                <Input
                  placeholder="Comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <MutationButton
                  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  size="sm"
                  isPending={createReview.isPending}
                  pendingLabel="Submitting..."
                  onClick={async () => {
                    if (rating < 1 || rating > 5) {
                      toast.error("Rating must be between 1 and 5");
                      return;
                    }
                    try {
                      await createReview.mutateAsync({
                        reservationId: r.id,
                        rating,
                        comment: comment || undefined,
                      });
                      toast.success("Review submitted");
                      setComment("");
                      await reservations.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Review failed");
                    }
                  }}
                >
                  Submit review
                </MutationButton>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {reservations.data?.length === 0 && (
        <EmptyState
          title="No reservations yet"
          description="Browse verified dorms, choose an available room, and submit your first move-in request."
          action={
            <Link to="/browse">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Browse dorms</Button>
            </Link>
          }
        />
      )}
    </div>
    </div>
  );
}
