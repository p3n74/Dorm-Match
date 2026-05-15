import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const roommateConversation = pgTable(
  "roommate_conversation",
  {
    id: text("id").primaryKey(),
    conversationKey: text("conversation_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("roommate_conversation_key_idx").on(table.conversationKey)],
);

export const roommateConversationParticipant = pgTable(
  "roommate_conversation_participant",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => roommateConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastReadAt: timestamp("last_read_at"),
  },
  (table) => [
    index("roommate_conversation_participant_userId_idx").on(table.userId),
    index("roommate_conversation_participant_conversationId_idx").on(table.conversationId),
    uniqueIndex("roommate_conversation_participant_unique_idx").on(table.conversationId, table.userId),
  ],
);

export const roommateMessage = pgTable(
  "roommate_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => roommateConversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("roommate_message_conversationId_idx").on(table.conversationId),
    index("roommate_message_senderId_idx").on(table.senderId),
  ],
);

export const roommateConversationRelations = relations(roommateConversation, ({ many }) => ({
  participants: many(roommateConversationParticipant),
  messages: many(roommateMessage),
}));

export const roommateConversationParticipantRelations = relations(roommateConversationParticipant, ({ one }) => ({
  conversation: one(roommateConversation, {
    fields: [roommateConversationParticipant.conversationId],
    references: [roommateConversation.id],
  }),
  user: one(user, {
    fields: [roommateConversationParticipant.userId],
    references: [user.id],
  }),
}));

export const roommateMessageRelations = relations(roommateMessage, ({ one }) => ({
  conversation: one(roommateConversation, {
    fields: [roommateMessage.conversationId],
    references: [roommateConversation.id],
  }),
  sender: one(user, {
    fields: [roommateMessage.senderId],
    references: [user.id],
  }),
}));
