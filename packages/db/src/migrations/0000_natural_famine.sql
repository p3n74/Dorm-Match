CREATE TYPE "public"."availability_status" AS ENUM('available', 'reserved', 'occupied');--> statement-breakpoint
CREATE TYPE "public"."complaint_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."complaint_target_type" AS ENUM('listing', 'user', 'reservation');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('gcash', 'paymaya', 'bank_transfer', 'cash');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('security_deposit', 'monthly_rent', 'advance', 'refund');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('single', 'double', 'bedspace');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('tenant', 'dorm_owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "complaint" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" "complaint_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"description" text NOT NULL,
	"status" "complaint_status" DEFAULT 'open' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'tenant' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"room_id" text NOT NULL,
	"move_in_date" timestamp NOT NULL,
	"move_out_date" timestamp,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"dorm_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"landlord_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_reservation_id_unique" UNIQUE("reservation_id")
);
--> statement-breakpoint
CREATE TABLE "roommate_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"roommate_key" text NOT NULL,
	"roommate_name" text NOT NULL,
	"roommate_school" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roommate_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_name" text,
	"contact_number" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landlord_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school" text,
	"year_level" text,
	"budget_range" text,
	"preferences" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "amenity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "amenity_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dorm" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"house_rules" text,
	"latitude" double precision,
	"longitude" double precision,
	"nearby_school" text,
	"listing_status" "listing_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_amenity" (
	"dorm_id" text NOT NULL,
	"amenity_id" text NOT NULL,
	CONSTRAINT "dorm_amenity_dorm_id_amenity_id_pk" PRIMARY KEY("dorm_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "dorm_photo" (
	"id" text PRIMARY KEY NOT NULL,
	"dorm_id" text NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"dorm_id" text NOT NULL,
	"room_type" "room_type" NOT NULL,
	"monthly_rate" integer NOT NULL,
	"max_occupancy" integer DEFAULT 1 NOT NULL,
	"availability_status" "availability_status" DEFAULT 'available' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_tenant_id_tenant_profile_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_tenant_id_tenant_profile_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_dorm_id_dorm_id_fk" FOREIGN KEY ("dorm_id") REFERENCES "public"."dorm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_conversation" ADD CONSTRAINT "roommate_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_message" ADD CONSTRAINT "roommate_message_conversation_id_roommate_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."roommate_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_profile" ADD CONSTRAINT "landlord_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_profile" ADD CONSTRAINT "tenant_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm" ADD CONSTRAINT "dorm_landlord_id_landlord_profile_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_amenity" ADD CONSTRAINT "dorm_amenity_dorm_id_dorm_id_fk" FOREIGN KEY ("dorm_id") REFERENCES "public"."dorm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_amenity" ADD CONSTRAINT "dorm_amenity_amenity_id_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_photo" ADD CONSTRAINT "dorm_photo_dorm_id_dorm_id_fk" FOREIGN KEY ("dorm_id") REFERENCES "public"."dorm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_dorm_id_dorm_id_fk" FOREIGN KEY ("dorm_id") REFERENCES "public"."dorm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "complaint_reporterId_idx" ON "complaint" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "complaint_status_idx" ON "complaint" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notification" USING btree ("read");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "payment_reservationId_idx" ON "payment" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_tenantId_idx" ON "reservation" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "reservation_roomId_idx" ON "reservation" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "reservation_status_idx" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_dormId_idx" ON "review" USING btree ("dorm_id");--> statement-breakpoint
CREATE INDEX "review_tenantId_idx" ON "review" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "roommate_conversation_userId_idx" ON "roommate_conversation" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roommate_conversation_user_roommate_idx" ON "roommate_conversation" USING btree ("user_id","roommate_key");--> statement-breakpoint
CREATE INDEX "roommate_message_conversationId_idx" ON "roommate_message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "landlord_profile_userId_idx" ON "landlord_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_profile_userId_idx" ON "tenant_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dorm_landlordId_idx" ON "dorm" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "dorm_listingStatus_idx" ON "dorm" USING btree ("listing_status");--> statement-breakpoint
CREATE INDEX "dorm_amenity_dormId_idx" ON "dorm_amenity" USING btree ("dorm_id");--> statement-breakpoint
CREATE INDEX "dorm_photo_dormId_idx" ON "dorm_photo" USING btree ("dorm_id");--> statement-breakpoint
CREATE INDEX "room_dormId_idx" ON "room" USING btree ("dorm_id");--> statement-breakpoint
CREATE INDEX "room_availabilityStatus_idx" ON "room" USING btree ("availability_status");