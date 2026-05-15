import "./load-env.js";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { createDb } from "./index";
import { createId } from "./lib/ids";
import { account, user } from "./schema/auth";
import {
  amenity,
  complaint,
  dorm,
  dormAmenity,
  dormPhoto,
  landlordProfile,
  notification,
  payment,
  reservation,
  review,
  room,
  roommateConversation,
  roommateConversationParticipant,
  roommateMessage,
  tenantProfile,
} from "./schema";

const db = createDb();

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@dormmatch.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";
  const tenantEmail = process.env.SEED_TENANT_EMAIL ?? "tenant@dormmatch.test";
  const tenantPassword = process.env.SEED_TENANT_PASSWORD ?? "TenantPass123!";
  const landlordEmail = process.env.SEED_LANDLORD_EMAIL ?? "landlord@dormmatch.test";
  const landlordPassword = process.env.SEED_LANDLORD_PASSWORD ?? "LandlordPass123!";

  const amenityNames = ["Wi-Fi", "Laundry", "Air Conditioning", "CCTV", "Study Area"];
  const amenityRecords = [];

  for (const name of amenityNames) {
    await db.insert(amenity).values({ id: createId(), name }).onConflictDoNothing({
      target: amenity.name,
    });
    const [row] = await db.select().from(amenity).where(eq(amenity.name, name)).limit(1);
    if (row) amenityRecords.push(row);
  }

  const tenantUserId = await upsertUser(tenantEmail, tenantPassword, "Sample Tenant", "tenant");
  const tenantTwoUserId = await upsertUser(
    "student2@dormmatch.test",
    "StudentPass123!",
    "Mika Reyes",
    "tenant",
  );
  const landlordUserId = await upsertUser(
    landlordEmail,
    landlordPassword,
    "Sample Landlord",
    "dorm_owner",
  );
  const secondLandlordUserId = await upsertUser(
    "owner2@dormmatch.test",
    "OwnerPass123!",
    "Jules Property Host",
    "dorm_owner",
  );
  await upsertUser(adminEmail, adminPassword, "Admin User", "admin");

  const tenantProfileId = await upsertTenantProfile(tenantUserId);
  const tenantTwoProfileId = await upsertTenantProfile(tenantTwoUserId, {
    school: "University of Santo Tomas",
    yearLevel: "3",
    budgetRange: "4000-6500",
    preferences: "Study buddy, clean space, early bird",
  });
  const landlordProfileId = await upsertLandlordProfile(
    landlordUserId,
    "approved",
    "Heights Property Management",
    "+639171234567",
  );
  const secondLandlordProfileId = await upsertLandlordProfile(
    secondLandlordUserId,
    "pending",
    "Northline Dorm Group",
    "+639189876543",
  );

  const uscDormId = await upsertDorm({
    landlordId: landlordProfileId,
    name: "USC Heights Dormitory",
    address: "123 Colon St, Cebu City",
    description: "Clean, secure, and walkable dorm near USC with quiet study corners.",
    houseRules: "Quiet hours 10PM-6AM. No smoking. Guests allowed until 8PM.",
    nearbySchool: "University of San Carlos",
    listingStatus: "approved",
    latitude: 10.299,
    longitude: 123.901,
  });

  const ustDormId = await upsertDorm({
    landlordId: landlordProfileId,
    name: "Indigo Commons Residences",
    address: "Sampaloc, Manila",
    description: "Community-focused dorm with shared study tables, laundry, and fast Wi-Fi.",
    houseRules: "Visitors must log in. Shared kitchen closes at 11PM.",
    nearbySchool: "University of Santo Tomas",
    listingStatus: "approved",
    latitude: 14.6091,
    longitude: 120.989,
  });

  const pendingDormId = await upsertDorm({
    landlordId: secondLandlordProfileId,
    name: "Northline Student House",
    address: "Mabolo, Cebu City",
    description: "Budget-friendly rooms pending admin review.",
    houseRules: "No overnight guests without prior approval.",
    nearbySchool: "Cebu Institute of Technology",
    listingStatus: "pending",
    latitude: 10.318,
    longitude: 123.914,
  });

  const uscSingleRoomId = await upsertRoom(uscDormId, "single", 4500, "available", 1, "Private single room");
  await upsertRoom(uscDormId, "bedspace", 2800, "available", 1, "Shared bedspace with study desk");
  const ustDoubleRoomId = await upsertRoom(ustDormId, "double", 6200, "reserved", 2, "Shared double room");
  await upsertRoom(ustDormId, "single", 7800, "available", 1, "Premium solo room");
  await upsertRoom(pendingDormId, "bedspace", 2500, "available", 1, "Budget bedspace");

  await attachAmenities(uscDormId, ["Wi-Fi", "Laundry", "CCTV", "Study Area"]);
  await attachAmenities(ustDormId, ["Wi-Fi", "Laundry", "Air Conditioning", "Study Area"]);
  await attachAmenities(pendingDormId, ["Wi-Fi", "CCTV"]);

  await addPhotoIfMissing(
    uscDormId,
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
    "Bright shared common area near USC",
  );
  await addPhotoIfMissing(
    uscDormId,
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "Cozy furnished single room",
  );
  await addPhotoIfMissing(
    ustDormId,
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "Indigo Commons study lounge",
  );
  await addPhotoIfMissing(
    pendingDormId,
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    "Northline sample room",
  );

  const pendingReservationId = await upsertReservation(
    tenantProfileId,
    uscSingleRoomId,
    "pending",
    new Date("2026-06-01"),
  );
  const confirmedReservationId = await upsertReservation(
    tenantTwoProfileId,
    ustDoubleRoomId,
    "confirmed",
    new Date("2026-06-15"),
  );
  const completedReservationId = await upsertReservation(
    tenantProfileId,
    ustDoubleRoomId,
    "completed",
    new Date("2026-01-10"),
    new Date("2026-05-10"),
  );

  await addPaymentIfMissing(confirmedReservationId, 6200, "monthly_rent", "gcash", "June rent paid via GCash");
  await addPaymentIfMissing(completedReservationId, 6200, "security_deposit", "bank_transfer", "Deposit settled");
  await addPaymentIfMissing(completedReservationId, 6200, "monthly_rent", "cash", "Final month rent");

  await addReviewIfMissing(
    completedReservationId,
    tenantProfileId,
    ustDormId,
    5,
    "Great study environment and responsive landlord.",
    "Thank you for staying with us!",
  );

  await addComplaintIfMissing(
    tenantUserId,
    "listing",
    pendingDormId,
    "Listing needs clearer proof of amenities before approval.",
  );

  await addNotificationIfMissing(tenantUserId, "reservation_update", "Your reservation request is pending review.");
  await addNotificationIfMissing(tenantTwoUserId, "reservation_update", "Your reservation was confirmed.");
  await addNotificationIfMissing(
    landlordUserId,
    "reservation_request",
    "New reservation request for USC Heights Dormitory.",
  );

  await addRoommateChatIfMissing(
    tenantUserId,
    tenantTwoUserId,
    "Mika Reyes",
    "UST",
    "Hi! I saw we have a strong roommate match. Want to compare budgets and schedules?",
  );

  console.log("Seed complete:");
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Tenant: ${tenantEmail} / ${tenantPassword}`);
  console.log("  Tenant 2: student2@dormmatch.test / StudentPass123!");
  console.log(`  Landlord: ${landlordEmail} / ${landlordPassword}`);
  console.log("  Landlord 2: owner2@dormmatch.test / OwnerPass123!");
}

async function upsertUser(
  email: string,
  password: string,
  name: string,
  role: "tenant" | "dorm_owner" | "admin",
) {
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    await db.update(user).set({ role, name }).where(eq(user.id, existing.id));
    return existing.id;
  }

  const id = createId();
  const hashed = await hashPassword(password);

  await db.insert(user).values({
    id,
    email,
    name,
    role,
    emailVerified: true,
  });

  await db.insert(account).values({
    id: createId(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: hashed,
  });

  return id;
}

async function upsertTenantProfile(
  userId: string,
  values = {
    school: "University of San Carlos",
    yearLevel: "2",
    budgetRange: "2500-5000",
    preferences: "Quiet, near campus",
  },
) {
  const [existing] = await db
    .select()
    .from(tenantProfile)
    .where(eq(tenantProfile.userId, userId))
    .limit(1);
  if (existing) {
    await db.update(tenantProfile).set(values).where(eq(tenantProfile.id, existing.id));
    return existing.id;
  }

  const id = createId();
  await db.insert(tenantProfile).values({
    id,
    userId,
    ...values,
  });
  return id;
}

async function upsertLandlordProfile(
  userId: string,
  verificationStatus: "pending" | "approved" | "rejected",
  businessName: string,
  contactNumber: string,
) {
  const [existing] = await db
    .select()
    .from(landlordProfile)
    .where(eq(landlordProfile.userId, userId))
    .limit(1);
  if (existing) {
    await db
      .update(landlordProfile)
      .set({
        verificationStatus,
        verifiedAt: verificationStatus === "approved" ? new Date() : null,
        businessName,
        contactNumber,
      })
      .where(eq(landlordProfile.id, existing.id));
    return existing.id;
  }

  const id = createId();
  await db.insert(landlordProfile).values({
    id,
    userId,
    businessName,
    contactNumber,
    verificationStatus,
    verifiedAt: verificationStatus === "approved" ? new Date() : null,
  });
  return id;
}

async function upsertDorm(values: {
  landlordId: string;
  name: string;
  address: string;
  description: string;
  houseRules: string;
  nearbySchool: string;
  listingStatus: "draft" | "pending" | "approved" | "rejected";
  latitude: number;
  longitude: number;
}) {
  const [existing] = await db.select().from(dorm).where(eq(dorm.name, values.name)).limit(1);
  if (existing) {
    await db.update(dorm).set(values).where(eq(dorm.id, existing.id));
    return existing.id;
  }

  const id = createId();
  await db.insert(dorm).values({ id, ...values });
  return id;
}

async function upsertRoom(
  dormId: string,
  roomType: "single" | "double" | "bedspace",
  monthlyRate: number,
  availabilityStatus: "available" | "reserved" | "occupied",
  maxOccupancy: number,
  description: string,
) {
  const [existing] = await db
    .select()
    .from(room)
    .where(and(eq(room.dormId, dormId), eq(room.roomType, roomType), eq(room.monthlyRate, monthlyRate)))
    .limit(1);
  if (existing) {
    await db
      .update(room)
      .set({ availabilityStatus, maxOccupancy, description })
      .where(eq(room.id, existing.id));
    return existing.id;
  }

  const id = createId();
  await db.insert(room).values({
    id,
    dormId,
    roomType,
    monthlyRate,
    maxOccupancy,
    availabilityStatus,
    description,
  });
  return id;
}

async function attachAmenities(dormId: string, names: string[]) {
  for (const name of names) {
    const [record] = await db.select().from(amenity).where(eq(amenity.name, name)).limit(1);
    if (!record) continue;

    await db.insert(dormAmenity).values({ dormId, amenityId: record.id }).onConflictDoNothing();
  }
}

async function addPhotoIfMissing(dormId: string, imageUrl: string, caption: string) {
  const [existing] = await db.select().from(dormPhoto).where(eq(dormPhoto.imageUrl, imageUrl)).limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(dormPhoto).values({ id, dormId, imageUrl, caption });
  return id;
}

async function upsertReservation(
  tenantId: string,
  roomId: string,
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled",
  moveInDate: Date,
  moveOutDate?: Date,
) {
  const [existing] = await db
    .select()
    .from(reservation)
    .where(and(eq(reservation.tenantId, tenantId), eq(reservation.roomId, roomId), eq(reservation.status, status)))
    .limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(reservation).values({
    id,
    tenantId,
    roomId,
    status,
    moveInDate,
    moveOutDate,
  });
  return id;
}

async function addPaymentIfMissing(
  reservationId: string,
  amount: number,
  paymentType: "security_deposit" | "monthly_rent" | "advance" | "refund",
  paymentMethod: "gcash" | "paymaya" | "bank_transfer" | "cash",
  notes: string,
) {
  const [existing] = await db
    .select()
    .from(payment)
    .where(
      and(
        eq(payment.reservationId, reservationId),
        eq(payment.amount, amount),
        eq(payment.paymentType, paymentType),
        eq(payment.paymentMethod, paymentMethod),
      ),
    )
    .limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(payment).values({
    id,
    reservationId,
    amount,
    paymentType,
    paymentMethod,
    status: "completed",
    paidAt: new Date(),
    notes,
  });
  return id;
}

async function addReviewIfMissing(
  reservationId: string,
  tenantId: string,
  dormId: string,
  rating: number,
  comment: string,
  landlordResponse: string,
) {
  const [existing] = await db.select().from(review).where(eq(review.reservationId, reservationId)).limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(review).values({
    id,
    reservationId,
    tenantId,
    dormId,
    rating,
    comment,
    landlordResponse,
  });
  return id;
}

async function addComplaintIfMissing(
  reporterId: string,
  targetType: "listing" | "user" | "reservation",
  targetId: string,
  description: string,
) {
  const [existing] = await db
    .select()
    .from(complaint)
    .where(and(eq(complaint.reporterId, reporterId), eq(complaint.targetId, targetId)))
    .limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(complaint).values({
    id,
    reporterId,
    targetType,
    targetId,
    description,
    status: "open",
  });
  return id;
}

async function addNotificationIfMissing(userId: string, type: string, message: string) {
  const [existing] = await db
    .select()
    .from(notification)
    .where(and(eq(notification.userId, userId), eq(notification.type, type), eq(notification.message, message)))
    .limit(1);
  if (existing) return existing.id;

  const id = createId();
  await db.insert(notification).values({ id, userId, type, message, read: false });
  return id;
}

async function addRoommateChatIfMissing(
  userId: string,
  roommateUserId: string,
  _roommateName: string,
  _roommateSchool: string,
  message: string,
) {
  const conversationKey = [userId, roommateUserId].sort().join(":");
  const [existing] = await db
    .select()
    .from(roommateConversation)
    .where(eq(roommateConversation.conversationKey, conversationKey))
    .limit(1);

  const conversationId = existing?.id ?? createId();
  if (!existing) {
    await db.insert(roommateConversation).values({
      id: conversationId,
      conversationKey,
    });
  }

  await addRoommateParticipantIfMissing(conversationId, userId);
  await addRoommateParticipantIfMissing(conversationId, roommateUserId);

  const [existingMessage] = await db
    .select()
    .from(roommateMessage)
    .where(and(eq(roommateMessage.conversationId, conversationId), eq(roommateMessage.body, message)))
    .limit(1);

  if (!existingMessage) {
    await db.insert(roommateMessage).values({
      id: createId(),
      conversationId,
      senderId: userId,
      body: message,
    });
  }

  return conversationId;
}

async function addRoommateParticipantIfMissing(conversationId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(roommateConversationParticipant)
    .where(
      and(
        eq(roommateConversationParticipant.conversationId, conversationId),
        eq(roommateConversationParticipant.userId, userId),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const id = createId();
  await db.insert(roommateConversationParticipant).values({ id, conversationId, userId });
  return id;
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
