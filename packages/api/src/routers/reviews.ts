import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import {
  dorm,
  landlordProfile,
  reservation,
  review,
  room,
  tenantProfile,
} from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { landlordProcedure, tenantProcedure } from "../middleware/roles";
import { publicProcedure, router } from "../index";

export const reviewsRouter = router({
  byDorm: publicProcedure.input(z.object({ dormId: z.string() })).query(async ({ input }) => {
    return db.select().from(review).where(eq(review.dormId, input.dormId));
  }),

  create: tenantProcedure
    .input(
      z.object({
        reservationId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
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

      const [record] = await db
        .select()
        .from(reservation)
        .where(
          and(
            eq(reservation.id, input.reservationId),
            eq(reservation.tenantId, profile.id),
            eq(reservation.status, "completed"),
          ),
        )
        .limit(1);

      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reviews are only allowed after a completed stay",
        });
      }

      const [existing] = await db
        .select()
        .from(review)
        .where(eq(review.reservationId, input.reservationId))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Review already submitted" });
      }

      const [targetRoom] = await db.select().from(room).where(eq(room.id, record.roomId)).limit(1);
      if (!targetRoom) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      const [created] = await db
        .insert(review)
        .values({
          id: createId(),
          reservationId: input.reservationId,
          tenantId: profile.id,
          dormId: targetRoom.dormId,
          rating: input.rating,
          comment: input.comment,
        })
        .returning();

      return created;
    }),

  respond: landlordProcedure
    .input(z.object({ reviewId: z.string(), response: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(review)
        .where(eq(review.id, input.reviewId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      const [listing] = await db.select().from(dorm).where(eq(dorm.id, existing.dormId)).limit(1);
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dorm not found" });
      }

      const [profile] = await db
        .select()
        .from(landlordProfile)
        .where(
          and(
            eq(landlordProfile.userId, ctx.session.user.id),
            eq(landlordProfile.id, listing.landlordId),
          ),
        )
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your review" });
      }

      const [updated] = await db
        .update(review)
        .set({ landlordResponse: input.response })
        .where(eq(review.id, input.reviewId))
        .returning();

      return updated;
    }),
});
