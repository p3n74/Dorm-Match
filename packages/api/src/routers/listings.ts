import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import {
  amenity,
  dorm,
  dormAmenity,
  dormPhoto,
  landlordProfile,
  room,
} from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { notifyUser } from "../lib/notifications";
import { adminProcedure, landlordProcedure } from "../middleware/roles";
import { publicProcedure, router } from "../index";

const dormInput = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  description: z.string().optional(),
  houseRules: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nearbySchool: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
});

const roomInput = z.object({
  dormId: z.string(),
  roomType: z.enum(["single", "double", "bedspace"]),
  monthlyRate: z.number().int().positive(),
  maxOccupancy: z.number().int().positive().default(1),
  description: z.string().optional(),
});

export const listingsRouter = router({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [listing] = await db.select().from(dorm).where(eq(dorm.id, input.id)).limit(1);
    if (!listing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
    }

    const rooms = await db.select().from(room).where(eq(room.dormId, listing.id));
    const photos = await db.select().from(dormPhoto).where(eq(dormPhoto.dormId, listing.id));
    const amenities = await db
      .select({ id: amenity.id, name: amenity.name })
      .from(dormAmenity)
      .innerJoin(amenity, eq(dormAmenity.amenityId, amenity.id))
      .where(eq(dormAmenity.dormId, listing.id));

    return { ...listing, rooms, photos, amenities };
  }),

  myListings: landlordProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select()
      .from(landlordProfile)
      .where(eq(landlordProfile.userId, ctx.session.user.id))
      .limit(1);

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile required" });
    }

    return db.select().from(dorm).where(eq(dorm.landlordId, profile.id));
  }),

  create: landlordProcedure.input(dormInput).mutation(async ({ ctx, input }) => {
    const [profile] = await db
      .select()
      .from(landlordProfile)
      .where(eq(landlordProfile.userId, ctx.session.user.id))
      .limit(1);

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile required" });
    }

    if (profile.verificationStatus !== "approved") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Landlord account must be verified before creating listings",
      });
    }

    const { amenityIds, ...dormData } = input;
    const dormId = createId();

    const [created] = await db
      .insert(dorm)
      .values({
        id: dormId,
        landlordId: profile.id,
        listingStatus: "draft",
        ...dormData,
      })
      .returning();

    if (amenityIds?.length) {
      await db.insert(dormAmenity).values(
        amenityIds.map((amenityId) => ({
          dormId,
          amenityId,
        })),
      );
    }

    return created;
  }),

  update: landlordProcedure
    .input(dormInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, amenityIds, ...data } = input;
      await assertLandlordOwnsDorm(ctx.session.user.id, id);

      const [updated] = await db.update(dorm).set(data).where(eq(dorm.id, id)).returning();

      if (amenityIds) {
        await db.delete(dormAmenity).where(eq(dormAmenity.dormId, id));
        if (amenityIds.length > 0) {
          await db.insert(dormAmenity).values(
            amenityIds.map((amenityId) => ({ dormId: id, amenityId })),
          );
        }
      }

      return updated;
    }),

  submitForApproval: landlordProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertLandlordOwnsDorm(ctx.session.user.id, input.id);
      const rooms = await db.select().from(room).where(eq(room.dormId, input.id));
      if (rooms.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one room before submitting",
        });
      }
      const photos = await db.select().from(dormPhoto).where(eq(dormPhoto.dormId, input.id)).limit(1);
      if (photos.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one listing photo before submitting",
        });
      }

      const [updated] = await db
        .update(dorm)
        .set({ listingStatus: "pending" })
        .where(eq(dorm.id, input.id))
        .returning();

      return updated;
    }),

  addRoom: landlordProcedure.input(roomInput).mutation(async ({ ctx, input }) => {
    await assertLandlordOwnsDorm(ctx.session.user.id, input.dormId);
    const [created] = await db
      .insert(room)
      .values({
        id: createId(),
        dormId: input.dormId,
        roomType: input.roomType,
        monthlyRate: input.monthlyRate,
        maxOccupancy: input.maxOccupancy,
        description: input.description,
        availabilityStatus: "available",
      })
      .returning();
    return created;
  }),

  addPhoto: landlordProcedure
    .input(
      z.object({
        dormId: z.string(),
        imageUrl: z.string().url(),
        caption: z.string().optional(),
        sortOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertLandlordOwnsDorm(ctx.session.user.id, input.dormId);
      const [created] = await db
        .insert(dormPhoto)
        .values({
          id: createId(),
          dormId: input.dormId,
          imageUrl: input.imageUrl,
          caption: input.caption,
          sortOrder: input.sortOrder,
        })
        .returning();
      return created;
    }),

  listAmenities: publicProcedure.query(async () => {
    return db.select().from(amenity);
  }),

  seedAmenities: adminProcedure.mutation(async () => {
    const defaults = [
      "Wi-Fi",
      "Laundry",
      "Air Conditioning",
      "Study Area",
      "CCTV",
      "Kitchen",
      "Water Heater",
    ];
    for (const name of defaults) {
      await db.insert(amenity).values({ id: createId(), name }).onConflictDoNothing({
        target: amenity.name,
      });
    }
    return db.select().from(amenity);
  }),

  moderate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ input }) => {
      const [listing] = await db.select().from(dorm).where(eq(dorm.id, input.id)).limit(1);
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      const [updated] = await db
        .update(dorm)
        .set({ listingStatus: input.status })
        .where(eq(dorm.id, input.id))
        .returning();

      const [profile] = await db
        .select()
        .from(landlordProfile)
        .where(eq(landlordProfile.id, listing.landlordId))
        .limit(1);

      if (profile) {
        await notifyUser(
          profile.userId,
          "listing_moderation",
          `Your listing "${listing.name}" was ${input.status}`,
        );
      }

      return updated;
    }),

  pendingApprovals: adminProcedure.query(async () => {
    return db.select().from(dorm).where(eq(dorm.listingStatus, "pending"));
  }),
});

async function assertLandlordOwnsDorm(userId: string, dormId: string) {
  const [profile] = await db
    .select()
    .from(landlordProfile)
    .where(eq(landlordProfile.userId, userId))
    .limit(1);

  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile required" });
  }

  const [listing] = await db
    .select()
    .from(dorm)
    .where(and(eq(dorm.id, dormId), eq(dorm.landlordId, profile.id)))
    .limit(1);

  if (!listing) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this listing" });
  }

  return listing;
}
