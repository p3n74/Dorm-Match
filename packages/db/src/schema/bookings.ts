import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { dorm, room } from "./listings";
import {
  paymentMethodEnum,
  paymentStatusEnum,
  paymentTypeEnum,
  reservationStatusEnum,
} from "./enums";
import { tenantProfile } from "./profiles";

export const reservation = pgTable(
  "reservation",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantProfile.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    moveInDate: timestamp("move_in_date").notNull(),
    moveOutDate: timestamp("move_out_date"),
    status: reservationStatusEnum("status").default("pending").notNull(),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reservation_tenantId_idx").on(table.tenantId),
    index("reservation_roomId_idx").on(table.roomId),
    index("reservation_status_idx").on(table.status),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    reservationId: text("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    paymentType: paymentTypeEnum("payment_type").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("payment_reservationId_idx").on(table.reservationId)],
);

export const review = pgTable(
  "review",
  {
    id: text("id").primaryKey(),
    reservationId: text("reservation_id")
      .notNull()
      .unique()
      .references(() => reservation.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantProfile.id, { onDelete: "cascade" }),
    dormId: text("dorm_id")
      .notNull()
      .references(() => dorm.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    landlordResponse: text("landlord_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("review_dormId_idx").on(table.dormId),
    index("review_tenantId_idx").on(table.tenantId),
  ],
);

export const reservationRelations = relations(reservation, ({ one, many }) => ({
  tenant: one(tenantProfile, {
    fields: [reservation.tenantId],
    references: [tenantProfile.id],
  }),
  room: one(room, {
    fields: [reservation.roomId],
    references: [room.id],
  }),
  payments: many(payment),
  review: one(review, {
    fields: [reservation.id],
    references: [review.reservationId],
  }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  reservation: one(reservation, {
    fields: [payment.reservationId],
    references: [reservation.id],
  }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  reservation: one(reservation, {
    fields: [review.reservationId],
    references: [reservation.id],
  }),
  tenant: one(tenantProfile, {
    fields: [review.tenantId],
    references: [tenantProfile.id],
  }),
  dorm: one(dorm, {
    fields: [review.dormId],
    references: [dorm.id],
  }),
}));
