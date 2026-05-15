import { Avatar, AvatarFallback } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { Label } from "@DormMatch/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmAction, EmptyState, ErrorState, MutationButton, PageLoader } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/landlord/reservations")({
  component: LandlordReservationsPage,
});

function LandlordReservationsPage() {
  const inbox = useQuery(trpc.reservations.landlordInbox.queryOptions());
  const respond = useMutation(trpc.reservations.respond.mutationOptions());
  const setActive = useMutation(trpc.reservations.setActive.mutationOptions());
  const complete = useMutation(trpc.reservations.complete.mutationOptions());
  const recordPayment = useMutation(trpc.payments.record.mutationOptions());
  const [amount, setAmount] = useState("");

  if (inbox.isLoading) return <PageLoader label="Loading reservation inbox..." />;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-4">
      <Badge className="mb-2">Owner inbox</Badge>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">Reservation Inbox</h1>
      {inbox.isError && (
        <ErrorState
          title="Could not load reservation inbox"
          description={inbox.error.message}
          retry={() => void inbox.refetch()}
        />
      )}
      {inbox.data?.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{r.tenant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{r.tenant.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{r.tenant.email}</p>
                <Badge variant={r.status === "confirmed" || r.status === "active" ? "success" : "warning"}>
                  {r.status}
                </Badge>
              </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-black">{r.dorm.name}</p>
                <p className="capitalize text-muted-foreground">
                  {r.room.roomType} room · ₱{r.room.monthlyRate}/mo
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm md:grid-cols-3">
              <div>
                <p className="font-black">Move-in</p>
                <p className="text-muted-foreground">{new Date(r.moveInDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-black">Move-out</p>
                <p className="text-muted-foreground">
                  {r.moveOutDate ? new Date(r.moveOutDate).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <p className="font-black">Room status</p>
                <p className="capitalize text-muted-foreground">{r.room.availabilityStatus}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
            {r.status === "pending" && (
              <>
                <Button
                  size="sm"
                  disabled={respond.isPending}
                  onClick={async () => {
                    try {
                      await respond.mutateAsync({ id: r.id, accept: true });
                      toast.success("Accepted");
                      await inbox.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Accept failed");
                    }
                  }}
                >
                  {respond.isPending ? "Accepting..." : "Accept"}
                </Button>
                <ConfirmAction
                  title="Decline this request?"
                  description="The tenant will be notified that this room is unavailable."
                  confirmLabel="Decline request"
                  destructive
                  isPending={respond.isPending}
                  trigger={
                    <Button size="sm" variant="destructive">
                      Decline
                    </Button>
                  }
                  onConfirm={async () => {
                    try {
                      await respond.mutateAsync({
                        id: r.id,
                        accept: false,
                        cancellationReason: "Unavailable",
                      });
                      toast.success("Declined");
                      await inbox.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Decline failed");
                    }
                  }}
                />
              </>
            )}
            {r.status === "confirmed" && (
              <MutationButton
                size="sm"
                isPending={setActive.isPending}
                pendingLabel="Marking active..."
                onClick={async () => {
                  try {
                    await setActive.mutateAsync({ id: r.id });
                    toast.success("Marked active");
                    await inbox.refetch();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not mark active");
                  }
                }}
              >
                Mark active (move-in)
              </MutationButton>
            )}
            {r.status === "active" && (
              <>
                <ConfirmAction
                  title="Complete this stay?"
                  description="This will close the active reservation and return the room to available if no other active requests exist."
                  confirmLabel="Complete stay"
                  isPending={complete.isPending}
                  trigger={<Button size="sm">Complete stay</Button>}
                  onConfirm={async () => {
                    try {
                      await complete.mutateAsync({ id: r.id });
                      toast.success("Completed");
                      await inbox.refetch();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Complete failed");
                    }
                  }}
                />
                <div className="flex w-full items-end gap-2">
                  <div>
                    <Label>Record payment (₱)</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <MutationButton
                    size="sm"
                    isPending={recordPayment.isPending}
                    pendingLabel="Recording..."
                    onClick={async () => {
                      if (!amount || Number(amount) <= 0) {
                        toast.error("Enter a valid payment amount");
                        return;
                      }
                      try {
                        await recordPayment.mutateAsync({
                          reservationId: r.id,
                          amount: Number(amount),
                          paymentType: "monthly_rent",
                          paymentMethod: "cash",
                        });
                        toast.success("Payment recorded");
                        setAmount("");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Payment recording failed");
                      }
                    }}
                  >
                    Record rent
                  </MutationButton>
                </div>
              </>
            )}
            </div>
          </CardContent>
        </Card>
      ))}
      {inbox.data?.length === 0 && (
        <EmptyState
          title="No reservation requests yet"
          description="New tenant requests will appear here once students submit reservation requests for your rooms."
        />
      )}
    </div>
  );
}
