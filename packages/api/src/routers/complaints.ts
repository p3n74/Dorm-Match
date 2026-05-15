import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import { complaint } from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../middleware/roles";
import { protectedProcedure, router } from "../index";

export const complaintsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["listing", "user", "reservation"]),
        targetId: z.string(),
        description: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(complaint)
        .values({
          id: createId(),
          reporterId: ctx.session.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          description: input.description,
          status: "open",
        })
        .returning();

      return created;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(complaint).where(eq(complaint.reporterId, ctx.session.user.id));
  }),

  all: adminProcedure.query(async () => {
    return db.select().from(complaint);
  }),

  resolve: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["resolved", "dismissed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(complaint)
        .where(eq(complaint.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found" });
      }

      const [updated] = await db
        .update(complaint)
        .set({
          status: input.status,
          resolvedBy: ctx.session.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(complaint.id, input.id))
        .returning();

      return updated;
    }),
});
