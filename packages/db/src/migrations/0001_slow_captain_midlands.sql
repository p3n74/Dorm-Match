CREATE TABLE "roommate_conversation_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "roommate_conversation" DROP CONSTRAINT "roommate_conversation_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "roommate_conversation_userId_idx";--> statement-breakpoint
DROP INDEX "roommate_conversation_user_roommate_idx";--> statement-breakpoint
ALTER TABLE "roommate_conversation" ADD COLUMN "conversation_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roommate_message" ADD COLUMN "sender_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roommate_conversation_participant" ADD CONSTRAINT "roommate_conversation_participant_conversation_id_roommate_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."roommate_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_conversation_participant" ADD CONSTRAINT "roommate_conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roommate_conversation_participant_userId_idx" ON "roommate_conversation_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "roommate_conversation_participant_conversationId_idx" ON "roommate_conversation_participant" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roommate_conversation_participant_unique_idx" ON "roommate_conversation_participant" USING btree ("conversation_id","user_id");--> statement-breakpoint
ALTER TABLE "roommate_message" ADD CONSTRAINT "roommate_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roommate_conversation_key_idx" ON "roommate_conversation" USING btree ("conversation_key");--> statement-breakpoint
CREATE INDEX "roommate_message_senderId_idx" ON "roommate_message" USING btree ("sender_id");--> statement-breakpoint
ALTER TABLE "roommate_conversation" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "roommate_conversation" DROP COLUMN "roommate_key";--> statement-breakpoint
ALTER TABLE "roommate_conversation" DROP COLUMN "roommate_name";--> statement-breakpoint
ALTER TABLE "roommate_conversation" DROP COLUMN "roommate_school";--> statement-breakpoint
ALTER TABLE "roommate_message" DROP COLUMN "sender";