import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import {
  dorm,
  landlordProfile,
  payment,
  reservation,
  room,
  tenantProfile,
} from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { landlordProcedure, tenantProcedure } from "../middleware/roles";
import { router } from "../index";

export const paymentsRouter = router({
  record: landlordProcedure
    .input(
      z.object({
        reservationId: z.string(),
        amount: z.number().int().positive(),
        paymentType: z.enum(["security_deposit", "monthly_rent", "advance", "refund"]),
        paymentMethod: z.enum(["gcash", "paymaya", "bank_transfer", "cash"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertLandlordOwnsReservation(ctx.session.user.id, input.reservationId);

      const [created] = await db
        .insert(payment)
        .values({
          id: createId(),
          reservationId: input.reservationId,
          amount: input.amount,
          paymentType: input.paymentType,
          paymentMethod: input.paymentMethod,
          status: "completed",
          paidAt: new Date(),
          notes: input.notes,
        })
        .returning();

      return created;
    }),

  byReservation: tenantProcedure
    .input(z.object({ reservationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertTenantOwnsReservation(ctx.session.user.id, input.reservationId);
      return db
        .select()
        .from(payment)
        .where(eq(payment.reservationId, input.reservationId));
    }),

  landlordByReservation: landlordProcedure
    .input(z.object({ reservationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertLandlordOwnsReservation(ctx.session.user.id, input.reservationId);
      return db
        .select()
        .from(payment)
        .where(eq(payment.reservationId, input.reservationId));
    }),

  summary: tenantProcedure
    .input(z.object({ reservationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertTenantOwnsReservation(ctx.session.user.id, input.reservationId);
      return buildPaymentSummary(input.reservationId);
    }),
});

async function buildPaymentSummary(reservationId: string) {
  const payments = await db
    .select()
    .from(payment)
    .where(eq(payment.reservationId, reservationId));

  const totalPaid = payments
    .filter((p) => p.status === "completed" && p.paymentType !== "refund")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunds = payments
    .filter((p) => p.status === "completed" && p.paymentType === "refund")
    .reduce((sum, p) => sum + p.amount, 0);

  const deposits = payments
    .filter((p) => p.paymentType === "security_deposit" && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    payments,
    totalPaid,
    totalRefunds,
    netPaid: totalPaid - totalRefunds,
    securityDepositHeld: deposits,
  };
}

async function assertTenantOwnsReservation(userId: string, reservationId: string) {
  const [profile] = await db
    .select()
    .from(tenantProfile)
    .where(eq(tenantProfile.userId, userId))
    .limit(1);

  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tenant profile required" });
  }

  const [record] = await db
    .select()
    .from(reservation)
    .where(and(eq(reservation.id, reservationId), eq(reservation.tenantId, profile.id)))
    .limit(1);

  if (!record) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your reservation" });
  }

  return record;
}

async function assertLandlordOwnsReservation(userId: string, reservationId: string) {
  const [profile] = await db
    .select()
    .from(landlordProfile)
    .where(eq(landlordProfile.userId, userId))
    .limit(1);

  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile required" });
  }

  const [record] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1);

  if (!record) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
  }

  const [targetRoom] = await db.select().from(room).where(eq(room.id, record.roomId)).limit(1);
  if (!targetRoom) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
  }

  const [listing] = await db
    .select()
    .from(dorm)
    .where(and(eq(dorm.id, targetRoom.dormId), eq(dorm.landlordId, profile.id)))
    .limit(1);

  if (!listing) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your reservation" });
  }

  return record;
}
