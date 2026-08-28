import cron from "node-cron";
import { runStandupSync, runFollowups } from "@/lib/scheduler";

function log(message: string) {
  console.log(`[scheduler] ${message}`);
}

export async function register() {
  if (typeof window !== "undefined") return;

  log("Starting in-process scheduler");

  cron.schedule("* * * * *", async () => {
    try {
      log("Running standup sync...");
      const result = await runStandupSync();
      log(`Standup sync done. Sent: ${result.sent}`);
    } catch (err) {
      log(`Standup sync failed: ${err}`);
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      log("Running follow-ups...");
      const result = await runFollowups();
      log(`Follow-ups done. Processed: ${result.processed}`);
    } catch (err) {
      log(`Follow-ups failed: ${err}`);
    }
  });

  log("Scheduler jobs registered (standup sync + followups every minute)");
}
