import { auth } from "@DormMatch/auth";
import { db } from "@DormMatch/db";
import { user } from "@DormMatch/db/schema";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";

export async function createContext(opts: CreateExpressContextOptions) {
  let session = await auth.api.getSession({
    headers: fromNodeHeaders(opts.req.headers),
  });

  if (session?.user) {
    const [dbUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
    if (dbUser) {
      session = {
        ...session,
        user: {
          ...session.user,
          role: dbUser.role,
        },
      };
    }
  }

  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
