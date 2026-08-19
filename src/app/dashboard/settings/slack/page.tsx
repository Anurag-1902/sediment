import { SlackSettingsPage } from "./slack-settings-page";

export default function Page() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return <SlackSettingsPage appUrl={appUrl} />;
}
