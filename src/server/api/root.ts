import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { projectRouter } from "./routers/project";
import { updateRouter } from "./routers/update";
import { taskRouter } from "./routers/task";
import { aiRouter } from "./routers/ai";
import { slackRouter } from "./routers/slack";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  project: projectRouter,
  update: updateRouter,
  task: taskRouter,
  ai: aiRouter,
  slack: slackRouter,
});

export type AppRouter = typeof appRouter;
