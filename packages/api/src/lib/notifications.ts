import { db } from "@DormMatch/db";
import { createId } from "@DormMatch/db/lib/ids";
import { notification } from "@DormMatch/db/schema";

export async function notifyUser(userId: string, type: string, message: string) {
  await db.insert(notification).values({
    id: createId(),
    userId,
    type,
    message,
    read: false,
  });
}
