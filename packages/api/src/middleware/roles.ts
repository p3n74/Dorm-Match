import type { UserRole } from "@DormMatch/db/schema/enums";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "../index";

export function roleProcedure(...allowedRoles: UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    const role = (ctx.session.user as { role?: UserRole }).role;
    if (!role || !allowedRoles.includes(role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }
    return next({
      ctx: {
        ...ctx,
        userRole: role,
      },
    });
  });
}

export const tenantProcedure = roleProcedure("tenant");
export const landlordProcedure = roleProcedure("dorm_owner");
export const adminProcedure = roleProcedure("admin");
