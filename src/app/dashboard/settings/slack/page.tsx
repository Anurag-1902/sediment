import { SlackSettingsPage } from "./slack-settings-page";

export default function Page() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const hasEnvFallback = Boolean(
    process.env.SLACK_CLIENT_ID && process.env.SLACK_BOT_TOKEN
  );
  return (
    <SlackSettingsPage appUrl={appUrl} hasEnvFallback={hasEnvFallback} />
  );
}
