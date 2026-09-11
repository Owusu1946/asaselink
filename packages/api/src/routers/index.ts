import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { authRouter } from "./auth";
import { companyRouter } from "./company";
import { adminRouter } from "./admin";
import { landRouter } from "./land";
import { reservationRouter } from "./reservations";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  auth: authRouter,
  company: companyRouter,
  admin: adminRouter,
  land: landRouter,
  reservations: reservationRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
