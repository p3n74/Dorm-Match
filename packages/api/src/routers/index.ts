import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { chatRouter } from "./chat";
import { complaintsRouter } from "./complaints";
import { listingsRouter } from "./listings";
import { notificationsRouter } from "./notifications";
import { paymentsRouter } from "./payments";
import { profileRouter } from "./profile";
import { reservationsRouter } from "./reservations";
import { reviewsRouter } from "./reviews";
import { searchRouter } from "./search";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
  profile: profileRouter,
  listings: listingsRouter,
  search: searchRouter,
  reservations: reservationsRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  complaints: complaintsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
