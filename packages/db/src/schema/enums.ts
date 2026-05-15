import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["tenant", "dorm_owner", "admin"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);

export const roomTypeEnum = pgEnum("room_type", ["single", "double", "bedspace"]);

export const availabilityStatusEnum = pgEnum("availability_status", [
  "available",
  "reserved",
  "occupied",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "security_deposit",
  "monthly_rent",
  "advance",
  "refund",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "gcash",
  "paymaya",
  "bank_transfer",
  "cash",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
  "open",
  "resolved",
  "dismissed",
]);

export const complaintTargetTypeEnum = pgEnum("complaint_target_type", [
  "listing",
  "user",
  "reservation",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ReservationStatus = (typeof reservationStatusEnum.enumValues)[number];
export type AvailabilityStatus = (typeof availabilityStatusEnum.enumValues)[number];
