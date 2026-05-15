import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { landlordProfile } from "./profiles";
import {
  availabilityStatusEnum,
  listingStatusEnum,
  roomTypeEnum,
} from "./enums";

export const dorm = pgTable(
  "dorm",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id")
      .notNull()
      .references(() => landlordProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    description: text("description"),
    houseRules: text("house_rules"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    nearbySchool: text("nearby_school"),
    listingStatus: listingStatusEnum("listing_status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("dorm_landlordId_idx").on(table.landlordId),
    index("dorm_listingStatus_idx").on(table.listingStatus),
  ],
);

export const room = pgTable(
  "room",
  {
    id: text("id").primaryKey(),
    dormId: text("dorm_id")
      .notNull()
      .references(() => dorm.id, { onDelete: "cascade" }),
    roomType: roomTypeEnum("room_type").notNull(),
    monthlyRate: integer("monthly_rate").notNull(),
    maxOccupancy: integer("max_occupancy").default(1).notNull(),
    availabilityStatus: availabilityStatusEnum("availability_status")
      .default("available")
      .notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("room_dormId_idx").on(table.dormId),
    index("room_availabilityStatus_idx").on(table.availabilityStatus),
  ],
);

export const amenity = pgTable("amenity", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const dormAmenity = pgTable(
  "dorm_amenity",
  {
    dormId: text("dorm_id")
      .notNull()
      .references(() => dorm.id, { onDelete: "cascade" }),
    amenityId: text("amenity_id")
      .notNull()
      .references(() => amenity.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.dormId, table.amenityId] }),
    index("dorm_amenity_dormId_idx").on(table.dormId),
  ],
);

export const dormPhoto = pgTable(
  "dorm_photo",
  {
    id: text("id").primaryKey(),
    dormId: text("dorm_id")
      .notNull()
      .references(() => dorm.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("dorm_photo_dormId_idx").on(table.dormId)],
);

export const dormRelations = relations(dorm, ({ one, many }) => ({
  landlord: one(landlordProfile, {
    fields: [dorm.landlordId],
    references: [landlordProfile.id],
  }),
  rooms: many(room),
  photos: many(dormPhoto),
  dormAmenities: many(dormAmenity),
}));

export const roomRelations = relations(room, ({ one }) => ({
  dorm: one(dorm, {
    fields: [room.dormId],
    references: [dorm.id],
  }),
}));

export const amenityRelations = relations(amenity, ({ many }) => ({
  dormAmenities: many(dormAmenity),
}));

export const dormAmenityRelations = relations(dormAmenity, ({ one }) => ({
  dorm: one(dorm, {
    fields: [dormAmenity.dormId],
    references: [dorm.id],
  }),
  amenity: one(amenity, {
    fields: [dormAmenity.amenityId],
    references: [amenity.id],
  }),
}));

export const dormPhotoRelations = relations(dormPhoto, ({ one }) => ({
  dorm: one(dorm, {
    fields: [dormPhoto.dormId],
    references: [dorm.id],
  }),
}));
