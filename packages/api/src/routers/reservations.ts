import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import { dorm, landlordProfile, reservation, room, tenantProfile, user } from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, not } from "drizzle-orm";
import { z } from "zod";

import { notifyUser } from "../lib/notifications";
import { roomStatusForReservation } from "../lib/room-status";
import { adminProcedure, landlordProcedure, tenantProcedure } from "../middleware/roles";
import { router } from "../index";

const activeReservationStatuses = ["pending", "confirmed", "active"] as const;

export const reservationsRouter = router({
  create: tenantProcedure
    .input(
      z.object({
        roomId: z.string(),
        moveInDate: z.coerce.date(),
        moveOutDate: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [profile] = await db
        .select()
        .from(tenantProfile)
        .where(eq(tenantProfile.userId, ctx.session.user.id))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant profile required" });
      }

      const [targetRoom] = await db.select().from(room).where(eq(room.id, input.roomId)).limit(1);
      if (!targetRoom) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      if (targetRoom.availabilityStatus !== "available") {
        throw new TRPCError({ code: "CONFLICT", message: "Room is not available" });
      }

      const [listing] = await db.select().from(dorm).where(eq(dorm.id, targetRoom.dormId)).limit(1);
      if (!listing || listing.listingStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing is not bookable" });
      }

      const conflicting = await db
        .select()
        .from(reservation)
        .where(
          and(
            eq(reservation.roomId, input.roomId),
            inArray(reservation.status, [...activeReservationStatuses]),
          ),
        )
        .limit(1);

      if (conflicting.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Room already has an active reservation request",
        });
      }

      const [created] = await db
        .insert(reservation)
        .values({
          id: createId(),
          tenantId: profile.id,
          roomId: input.roomId,
          moveInDate: input.moveInDate,
          moveOutDate: input.moveOutDate,
          status: "pending",
        })
        .returning();

      const [landlord] = await db
        .select()
        .from(landlordProfile)
        .where(eq(landlordProfile.id, listing.landlordId))
        .limit(1);

      if (landlord) {
        await notifyUser(
          landlord.userId,
          "reservation_request",
          `New reservation request for ${listing.name}`,
        );
      }

      return created;
    }),

  myReservations: tenantProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select()
      .from(tenantProfile)
      .where(eq(tenantProfile.userId, ctx.session.user.id))
      .limit(1);

    if (!profile) return [];

    return db.select().from(reservation).where(eq(reservation.tenantId, profile.id));
  }),

  landlordInbox: landlordProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select()
      .from(landlordProfile)
      .where(eq(landlordProfile.userId, ctx.session.user.id))
      .limit(1);

    if (!profile) return [];

    const dorms = await db.select().from(dorm).where(eq(dorm.landlordId, profile.id));
    const dormIds = dorms.map((d) => d.id);
    if (dormIds.length === 0) return [];

    const rooms = await db.select().from(room).where(inArray(room.dormId, dormIds));
    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length === 0) return [];

    const records = await db
      .select({
        reservation,
        room,
        dorm,
        tenantProfile,
        tenantName: user.name,
        tenantEmail: user.email,
      })
      .from(reservation)
      .innerJoin(room, eq(reservation.roomId, room.id))
      .innerJoin(dorm, eq(room.dormId, dorm.id))
      .innerJoin(tenantProfile, eq(reservation.tenantId, tenantProfile.id))
      .innerJoin(user, eq(tenantProfile.userId, user.id))
      .where(inArray(reservation.roomId, roomIds));

    return records.map((record) => ({
      ...record.reservation,
      room: record.room,
      dorm: record.dorm,
      tenant: {
        ...record.tenantProfile,
        name: record.tenantName,
        email: record.tenantEmail,
      },
    }));
  }),

  respond: landlordProcedure
    .input(
      z.object({
        id: z.string(),
        accept: z.boolean(),
        cancellationReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const record = await getReservationForLandlord(ctx.session.user.id, input.id);
      if (record.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation is not pending" });
      }

      const newStatus = input.accept ? "confirmed" : "cancelled";

      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(reservation)
          .set({
            status: newStatus,
            cancellationReason: input.accept ? null : input.cancellationReason,
          })
          .where(eq(reservation.id, input.id))
          .returning();

        const nextRoomStatus = roomStatusForReservation(newStatus);
        if (nextRoomStatus) {
          await tx
            .update(room)
            .set({ availabilityStatus: nextRoomStatus })
            .where(eq(room.id, record.roomId));
        }

        const [tenant] = await tx
          .select()
          .from(tenantProfile)
          .where(eq(tenantProfile.id, record.tenantId))
          .limit(1);

        if (tenant) {
          await notifyUser(
            tenant.userId,
            "reservation_update",
            input.accept
              ? "Your reservation was confirmed"
              : "Your reservation was declined",
          );
        }

        return updated;
      });
    }),

  setActive: landlordProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await getReservationForLandlord(ctx.session.user.id, input.id);
      if (record.status !== "confirmed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation must be confirmed" });
      }
      return transitionReservation(record.id, record.roomId, "active");
    }),

  complete: landlordProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await getReservationForLandlord(ctx.session.user.id, input.id);
      if (record.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation must be active" });
      }
      return transitionReservation(record.id, record.roomId, "completed");
    }),

  cancel: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await db
        .select()
        .from(tenantProfile)
        .where(eq(tenantProfile.userId, ctx.session.user.id))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant profile required" });
      }

      const [record] = await db
        .select()
        .from(reservation)
        .where(and(eq(reservation.id, input.id), eq(reservation.tenantId, profile.id)))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
      }

      if (!["pending", "confirmed"].includes(record.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel reservation in current status",
        });
      }

      return transitionReservation(record.id, record.roomId, "cancelled", input.reason);
    }),

  all: adminProcedure.query(async () => {
    return db.select().from(reservation);
  }),
});

async function transitionReservation(
  reservationId: string,
  roomId: string,
  status: "active" | "completed" | "cancelled",
  cancellationReason?: string,
) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(reservation)
      .set({
        status,
        cancellationReason: cancellationReason ?? null,
      })
      .where(eq(reservation.id, reservationId))
      .returning();

    const nextRoomStatus = roomStatusForReservation(status);
    if (nextRoomStatus) {
      const otherActive = await tx
        .select()
        .from(reservation)
        .where(
          and(
            eq(reservation.roomId, roomId),
            not(eq(reservation.id, reservationId)),
            inArray(reservation.status, [...activeReservationStatuses]),
          ),
        )
        .limit(1);

      if (otherActive.length === 0) {
        await tx
          .update(room)
          .set({ availabilityStatus: nextRoomStatus })
          .where(eq(room.id, roomId));
      }
    }

    return updated;
  });
}

async function getReservationForLandlord(userId: string, reservationId: string) {
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
