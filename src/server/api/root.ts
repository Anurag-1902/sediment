import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
