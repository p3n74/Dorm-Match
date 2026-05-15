import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import { roommateConversation, roommateConversationParticipant, roommateMessage, tenantProfile, user } from "@DormMatch/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const chatRouter = router({
  startRoommateChat: protectedProcedure
    .input(
      z.object({
        roommateKey: z.string().min(1),
        roommateName: z.string().min(1).optional(),
        roommateSchool: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      const roommateId = input.roommateKey;

      if (roommateId === currentUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot start a chat with yourself" });
      }

      await requireTenantUser(currentUserId);
      const roommate = await requireTenantUser(roommateId);
      if (!roommate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Roommate profile not found" });
      }

      const conversation = await ensureDirectConversation(currentUserId, roommate.id);
      return toConversationPreview(conversation.id, currentUserId);
    }),

  myRoommateChats: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db
      .select()
      .from(roommateConversationParticipant)
      .innerJoin(roommateConversation, eq(roommateConversationParticipant.conversationId, roommateConversation.id))
      .where(eq(roommateConversationParticipant.userId, ctx.session.user.id))
      .orderBy(desc(roommateConversation.updatedAt));

    const previews = [];
    for (const membership of memberships) {
      previews.push(await toConversationPreview(membership.roommate_conversation.id, ctx.session.user.id));
    }

    return previews;
  }),

  getRoommateChat: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    await assertConversationParticipant(input.id, ctx.session.user.id);
    const conversation = await toConversationPreview(input.id, ctx.session.user.id);
    const messages = await db
      .select({
        id: roommateMessage.id,
        body: roommateMessage.body,
        createdAt: roommateMessage.createdAt,
        senderId: roommateMessage.senderId,
        senderName: user.name,
      })
      .from(roommateMessage)
      .innerJoin(user, eq(roommateMessage.senderId, user.id))
      .where(eq(roommateMessage.conversationId, input.id))
      .orderBy(asc(roommateMessage.createdAt));

    return {
      conversation,
      messages: messages.map((message) => ({
        ...message,
        isMine: message.senderId === ctx.session.user.id,
      })),
    };
  }),

  sendRoommateMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        body: z.string().trim().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertConversationParticipant(input.conversationId, ctx.session.user.id);

      const [created] = await db
        .insert(roommateMessage)
        .values({
          id: createId(),
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          body: input.body,
        })
        .returning();

      await db
        .update(roommateConversation)
        .set({ updatedAt: new Date() })
        .where(eq(roommateConversation.id, input.conversationId));

      return created;
    }),
});

async function assertConversationParticipant(conversationId: string, userId: string) {
  const [participant] = await db
    .select()
    .from(roommateConversationParticipant)
    .where(
      and(
        eq(roommateConversationParticipant.conversationId, conversationId),
        eq(roommateConversationParticipant.userId, userId),
      ),
    )
    .limit(1);

  if (!participant) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Roommate chat not found" });
  }
}

async function ensureDirectConversation(firstUserId: string, secondUserId: string) {
  const conversationKey = makeConversationKey(firstUserId, secondUserId);

  const [existing] = await db
    .select()
    .from(roommateConversation)
    .where(eq(roommateConversation.conversationKey, conversationKey))
    .limit(1);

  if (existing) {
    await ensureParticipant(existing.id, firstUserId);
    await ensureParticipant(existing.id, secondUserId);
    return existing;
  }

  await db.insert(roommateConversation).values({ id: createId(), conversationKey }).onConflictDoNothing({
    target: roommateConversation.conversationKey,
  });

  const [conversation] = await db
    .select()
    .from(roommateConversation)
    .where(eq(roommateConversation.conversationKey, conversationKey))
    .limit(1);

  if (!conversation) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create roommate chat" });
  }

  await ensureParticipant(conversation.id, firstUserId);
  await ensureParticipant(conversation.id, secondUserId);

  return conversation;
}

async function ensureParticipant(conversationId: string, userId: string) {
  await db
    .insert(roommateConversationParticipant)
    .values({ id: createId(), conversationId, userId })
    .onConflictDoNothing({
      target: [
        roommateConversationParticipant.conversationId,
        roommateConversationParticipant.userId,
      ],
    });
}

async function requireTenantUser(userId: string) {
  const [record] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
      school: tenantProfile.school,
    })
    .from(user)
    .leftJoin(tenantProfile, eq(tenantProfile.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (!record || record.role !== "tenant") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tenant profile not found" });
  }

  return record;
}

async function toConversationPreview(conversationId: string, currentUserId: string) {
  const [conversation] = await db
    .select()
    .from(roommateConversation)
    .where(eq(roommateConversation.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Roommate chat not found" });
  }

  const [roommate] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      school: tenantProfile.school,
    })
    .from(roommateConversationParticipant)
    .innerJoin(user, eq(roommateConversationParticipant.userId, user.id))
    .leftJoin(tenantProfile, eq(tenantProfile.userId, user.id))
    .where(
      and(
        eq(roommateConversationParticipant.conversationId, conversationId),
        eq(user.id, getOtherUserId(conversation.conversationKey, currentUserId)),
      ),
    )
    .limit(1);

  if (!roommate) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Roommate participant not found" });
  }

  const [latestMessage] = await db
    .select({
      body: roommateMessage.body,
      createdAt: roommateMessage.createdAt,
      senderId: roommateMessage.senderId,
    })
    .from(roommateMessage)
    .where(eq(roommateMessage.conversationId, conversationId))
    .orderBy(desc(roommateMessage.createdAt))
    .limit(1);

  return {
    id: conversation.id,
    updatedAt: conversation.updatedAt,
    roommate,
    latestMessage: latestMessage ?? null,
  };
}

function makeConversationKey(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join(":");
}

function getOtherUserId(conversationKey: string, currentUserId: string) {
  const [firstUserId, secondUserId] = conversationKey.split(":");
  return firstUserId === currentUserId ? secondUserId : firstUserId;
}
