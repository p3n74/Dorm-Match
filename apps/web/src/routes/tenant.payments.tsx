import { Badge } from "@DormMatch/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ErrorState, PageLoader } from "@/components/feedback";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/tenant/payments")({
  component: TenantPaymentsPage,
});

function TenantPaymentsPage() {
  const payments = useQuery(
    trpc.payments.myHistory.queryOptions()
  );

  if (payments.isLoading) {
    return <PageLoader label="Loading payment history..." />;
  }

  if (payments.isError) {


    return (
      <ErrorState
        title="Could not load payment history"
        description={payments.error.message}
        retry={() => void payments.refetch()}
      />
    );
  }

  const paymentHistory = payments.data ?? [];

  const totalPaid = paymentHistory.reduce(
  (sum, payment) => sum + payment.amount,
  0,
);

const securityDepositPaid = paymentHistory
  .filter((payment) => payment.paymentType === "security_deposit")
  .reduce((sum, payment) => sum + payment.amount, 0);

const totalPayments = paymentHistory.length;

  return (
  <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Badge className="mb-3 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">
        Payments
      </Badge>

      <h1 className="mb-6 text-4xl font-black text-[#1E293B]">
        Payment History
      </h1>
      
      <div className="mb-8 grid gap-4 md:grid-cols-3">
  <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
    <CardHeader>
      <CardTitle className="text-sm font-semibold text-[#64748B]">
        Total Paid
      </CardTitle>
    </CardHeader>
    <CardContent className="text-4xl font-black text-[#2563EB]">
      ₱{totalPaid.toLocaleString()}
    </CardContent>
  </Card>

  <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
    <CardHeader>
      <CardTitle className="text-sm font-semibold text-[#64748B]">
        Number of Payments
      </CardTitle>
    </CardHeader>
    <CardContent className="text-4xl font-black text-[#2563EB]">
      {totalPayments}
    </CardContent>
  </Card>

  <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
    <CardHeader>
      <CardTitle className="text-sm font-semibold text-[#64748B]">
        Security Deposit Paid
      </CardTitle>
    </CardHeader>
    <CardContent className="text-4xl font-black text-[#2563EB]">
      ₱{securityDepositPaid.toLocaleString()}
    </CardContent>
  </Card>
</div>

      {paymentHistory.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Your completed rent and deposit payments will appear here."
        />
      ) : (
        <div className="space-y-4">
         {paymentHistory.map((payment) => (
            <Card
              key={payment.id}
              className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#1E293B]">
                      {payment.reservation.room.dorm.name}
                    </CardTitle>

                    <p className="mt-1 text-sm text-[#64748B]">
                      {payment.reservation.room.roomType} Room
                    </p>
                  </div>

                  <Badge
  className={
    payment.status === "completed"
      ? "rounded-full bg-green-100 text-green-700"
      : payment.status === "pending"
      ? "rounded-full bg-yellow-100 text-yellow-700"
      : "rounded-full bg-red-100 text-red-700"
  }
>
  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Amount</span>

                  <span className="font-bold text-[#1E293B]">
                    ₱{payment.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Payment Type</span>

                  <span className="capitalize text-[#1E293B]">
                    {payment.paymentType.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Payment Method</span>

                  <span className="capitalize text-[#1E293B]">
                    {payment.paymentMethod.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Date Paid</span>

                  <span className="text-[#1E293B]">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : "Not recorded"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
);
}