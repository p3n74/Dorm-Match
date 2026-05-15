import { db } from "@DormMatch/db";
import { complaint, dorm, landlordProfile, payment, reservation, user } from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { notifyUser } from "../lib/notifications";
import { adminProcedure } from "../middleware/roles";
import { router } from "../index";

export const adminRouter = router({
  users: adminProcedure.query(async () => {
    return db.select().from(user);
  }),

  verifyLandlord: adminProcedure
    .input(
      z.object({
        profileId: z.string(),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(landlordProfile)
        .set({
          verificationStatus: input.status,
          verifiedAt: input.status === "approved" ? new Date() : null,
        })
        .where(eq(landlordProfile.id, input.profileId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile not found" });
      }

      await notifyUser(
        updated.userId,
        "landlord_verification",
        `Your landlord verification was ${input.status}`,
      );

      return updated;
    }),

  pendingLandlords: adminProcedure.query(async () => {
    return db
      .select()
      .from(landlordProfile)
      .where(eq(landlordProfile.verificationStatus, "pending"));
  }),

  reports: adminProcedure.query(async () => {
    const [userCount] = await db.select({ value: count() }).from(user);
    const [listingCount] = await db.select({ value: count() }).from(dorm);
    const [reservationCount] = await db.select({ value: count() }).from(reservation);
    const [paymentCount] = await db.select({ value: count() }).from(payment);
    const [openComplaints] = await db
      .select({ value: count() })
      .from(complaint)
      .where(eq(complaint.status, "open"));

    const [approvedListings] = await db
      .select({ value: count() })
      .from(dorm)
      .where(eq(dorm.listingStatus, "approved"));

    return {
      users: userCount?.value ?? 0,
      listings: listingCount?.value ?? 0,
      approvedListings: approvedListings?.value ?? 0,
      reservations: reservationCount?.value ?? 0,
      payments: paymentCount?.value ?? 0,
      openComplaints: openComplaints?.value ?? 0,
    };
  }),
});
