import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import { landlordProfile, tenantProfile, user } from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const tenantProfileSchema = z.object({
  school: z.string().min(1).optional(),
  yearLevel: z.string().min(1).optional(),
  budgetRange: z.string().min(1).optional(),
  preferences: z.string().optional(),
});

const landlordProfileSchema = z.object({
  businessName: z.string().min(1).optional(),
  contactNumber: z.string().min(1).optional(),
});

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [record] = await db.select().from(user).where(eq(user.id, ctx.session.user.id)).limit(1);

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const role = record.role;
    let profile = null;

    if (role === "tenant") {
      const [tenant] = await db
        .select()
        .from(tenantProfile)
        .where(eq(tenantProfile.userId, record.id))
        .limit(1);
      profile = tenant ?? null;
    } else if (role === "dorm_owner") {
      const [landlord] = await db
        .select()
        .from(landlordProfile)
        .where(eq(landlordProfile.userId, record.id))
        .limit(1);
      profile = landlord ?? null;
    }

    return { user: record, profile };
  }),

  setRole: protectedProcedure
    .input(z.object({ role: z.enum(["tenant", "dorm_owner"]) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (existing.role === "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role cannot be changed",
        });
      }

      await db
        .update(user)
        .set({ role: input.role })
        .where(eq(user.id, ctx.session.user.id));

      if (input.role === "tenant") {
        const [tenant] = await db
          .select()
          .from(tenantProfile)
          .where(eq(tenantProfile.userId, ctx.session.user.id))
          .limit(1);
        if (!tenant) {
          await db.insert(tenantProfile).values({
            id: createId(),
            userId: ctx.session.user.id,
          });
        }
      } else {
        const [landlord] = await db
          .select()
          .from(landlordProfile)
          .where(eq(landlordProfile.userId, ctx.session.user.id))
          .limit(1);
        if (!landlord) {
          await db.insert(landlordProfile).values({
            id: createId(),
            userId: ctx.session.user.id,
            verificationStatus: "pending",
          });
        }
      }

      return { success: true, role: input.role };
    }),

  upsertTenantProfile: protectedProcedure
    .input(tenantProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const [record] = await db.select().from(user).where(eq(user.id, ctx.session.user.id)).limit(1);
      if (!record || record.role !== "tenant") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tenant profile only" });
      }

      const [existing] = await db
        .select()
        .from(tenantProfile)
        .where(eq(tenantProfile.userId, ctx.session.user.id))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(tenantProfile)
          .set(input)
          .where(eq(tenantProfile.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(tenantProfile)
        .values({ id: createId(), userId: ctx.session.user.id, ...input })
        .returning();
      return created;
    }),

  upsertLandlordProfile: protectedProcedure
    .input(landlordProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const [record] = await db.select().from(user).where(eq(user.id, ctx.session.user.id)).limit(1);
      if (!record || record.role !== "dorm_owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Landlord profile only" });
      }

      const [existing] = await db
        .select()
        .from(landlordProfile)
        .where(eq(landlordProfile.userId, ctx.session.user.id))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(landlordProfile)
          .set(input)
          .where(eq(landlordProfile.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(landlordProfile)
        .values({
          id: createId(),
          userId: ctx.session.user.id,
          verificationStatus: "pending",
          ...input,
        })
        .returning();
      return created;
    }),
});
