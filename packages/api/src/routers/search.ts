import { db } from "@DormMatch/db";
import { amenity, dorm, dormAmenity, room, tenantProfile, user } from "@DormMatch/db/schema";
import { and, desc, eq, gte, lte, not, sql } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";

export const searchRouter = router({
  roommates: publicProcedure.query(async ({ ctx }) => {
    const filters = [eq(user.role, "tenant")];

    if (ctx.session?.user.id) {
      filters.push(not(eq(user.id, ctx.session.user.id)));
    }

    const tenants = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        school: tenantProfile.school,
        yearLevel: tenantProfile.yearLevel,
        budgetRange: tenantProfile.budgetRange,
        preferences: tenantProfile.preferences,
        createdAt: user.createdAt,
      })
      .from(user)
      .leftJoin(tenantProfile, eq(tenantProfile.userId, user.id))
      .where(and(...filters))
      .orderBy(desc(user.createdAt));

    return tenants.map((tenant) => ({
      ...tenant,
      key: tenant.id,
      school: tenant.school ?? "Student",
      budgetRange: tenant.budgetRange ?? "Budget not set",
      tags: tenant.preferences
        ? tenant.preferences
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : ["Looking for housing"],
    }));
  }),

  dorms: publicProcedure
    .input(
      z
        .object({
          minPrice: z.number().int().optional(),
          maxPrice: z.number().int().optional(),
          roomType: z.enum(["single", "double", "bedspace"]).optional(),
          availabilityStatus: z.enum(["available", "reserved", "occupied"]).optional(),
          amenityIds: z.array(z.string()).optional(),
          nearbySchool: z.string().optional(),
          query: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filters = [eq(dorm.listingStatus, "approved")];

      if (input?.nearbySchool) {
        filters.push(sql`${dorm.nearbySchool} ILIKE ${`%${input.nearbySchool}%`}`);
      }

      if (input?.query) {
        filters.push(
          sql`(${dorm.name} ILIKE ${`%${input.query}%`} OR ${dorm.address} ILIKE ${`%${input.query}%`})`,
        );
      }

      const listings = await db
        .select()
        .from(dorm)
        .where(and(...filters));

      const results = [];

      for (const listing of listings) {
        const roomFilters = [eq(room.dormId, listing.id)];
        if (input?.roomType) {
          roomFilters.push(eq(room.roomType, input.roomType));
        }
        if (input?.availabilityStatus) {
          roomFilters.push(eq(room.availabilityStatus, input.availabilityStatus));
        }
        if (input?.minPrice !== undefined) {
          roomFilters.push(gte(room.monthlyRate, input.minPrice));
        }
        if (input?.maxPrice !== undefined) {
          roomFilters.push(lte(room.monthlyRate, input.maxPrice));
        }

        const rooms = await db
          .select()
          .from(room)
          .where(and(...roomFilters));

        if (rooms.length === 0) continue;

        if (input?.amenityIds?.length) {
          const dormAmenities = await db
            .select()
            .from(dormAmenity)
            .where(eq(dormAmenity.dormId, listing.id));
          const ids = new Set(dormAmenities.map((a) => a.amenityId));
          const hasAll = input.amenityIds.every((id) => ids.has(id));
          if (!hasAll) continue;
        }

        const amenities = await db
          .select({ id: amenity.id, name: amenity.name })
          .from(dormAmenity)
          .innerJoin(amenity, eq(dormAmenity.amenityId, amenity.id))
          .where(eq(dormAmenity.dormId, listing.id));

        const minRate = Math.min(...rooms.map((r) => r.monthlyRate));
        const maxRate = Math.max(...rooms.map((r) => r.monthlyRate));

        results.push({
          ...listing,
          rooms,
          amenities,
          minRate,
          maxRate,
        });
      }

      return results;
    }),
});
