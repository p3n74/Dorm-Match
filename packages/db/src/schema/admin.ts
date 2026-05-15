import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { complaintStatusEnum, complaintTargetTypeEnum } from "./enums";

export const complaint = pgTable(
  "complaint",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: complaintTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    description: text("description").notNull(),
    status: complaintStatusEnum("status").default("open").notNull(),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("complaint_reporterId_idx").on(table.reporterId),
    index("complaint_status_idx").on(table.status),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_read_idx").on(table.read),
  ],
);

export const complaintRelations = relations(complaint, ({ one }) => ({
  reporter: one(user, {
    fields: [complaint.reporterId],
    references: [user.id],
    relationName: "complaintReporter",
  }),
  resolver: one(user, {
    fields: [complaint.resolvedBy],
    references: [user.id],
    relationName: "complaintResolver",
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
