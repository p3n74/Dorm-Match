import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { verificationStatusEnum } from "./enums";

export const tenantProfile = pgTable(
  "tenant_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    school: text("school"),
    yearLevel: text("year_level"),
    budgetRange: text("budget_range"),
    preferences: text("preferences"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("tenant_profile_userId_idx").on(table.userId)],
);

export const landlordProfile = pgTable(
  "landlord_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    businessName: text("business_name"),
    contactNumber: text("contact_number"),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("landlord_profile_userId_idx").on(table.userId)],
);

export const tenantProfileRelations = relations(tenantProfile, ({ one }) => ({
  user: one(user, {
    fields: [tenantProfile.userId],
    references: [user.id],
  }),
}));

export const landlordProfileRelations = relations(landlordProfile, ({ one }) => ({
  user: one(user, {
    fields: [landlordProfile.userId],
    references: [user.id],
  }),
}));
