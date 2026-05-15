import { db } from "@DormMatch/db";
import { notification } from "@DormMatch/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(notification)
      .where(eq(notification.userId, ctx.session.user.id))
      .orderBy(desc(notification.createdAt));
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(notification)
        .set({ read: true })
        .where(and(eq(notification.id, input.id), eq(notification.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notification)
      .set({ read: true })
      .where(eq(notification.userId, ctx.session.user.id));
    return { success: true };
  }),
});
