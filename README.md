# Sediment — AI-Powered Standup Automation Platform

Automate daily standups via Slack, use AI to track project progress, and query team updates from a unified dashboard.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- tRPC for type-safe API layer
- Prisma ORM + PostgreSQL
- Better Auth (KrutAuth) for authentication (email/password + Google OAuth)
- Tailwind CSS + shadcn/ui components
- Slack Web API + Slack Events API
- Gemini via KrutAI for all AI operations
- Node-cron for scheduled sync messages

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
KRUTAI_API_KEY=your_krutai_api_key
KRUTAI_SERVER_URL=http://krut-ai-backend:8000
KRUTAI_PROJECT_ID=your_project_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
GOOGLE_CLIENT_ID=optional_google_oauth_client_id
GOOGLE_CLIENT_SECRET=optional_google_oauth_client_secret
```

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Push the Prisma schema to your database:
   ```bash
   bunx prisma db push
   ```

3. Run the development server:
   ```bash
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app.
2. Choose "From an app manifest" and paste the contents of `slack-manifest.json`.
3. Replace `https://your-app-url.com` with your actual app URL.
4. Install the app to your workspace.
5. Copy the Bot User OAuth Token to `SLACK_BOT_TOKEN`.
6. Copy the Signing Secret to `SLACK_SIGNING_SECRET`.
7. Copy the Client ID and Client Secret to `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`.

## Cron Job

The app exposes `/api/cron` which checks every minute for projects whose sync time matches the current time and sends a Slack sync message.

For local development, you can hit this endpoint manually or set up a simple cron job with curl:

```bash
*/1 * * * * curl -s http://localhost:3000/api/cron > /dev/null 2>&1
```

For production deployment on Krut, configure a cron trigger pointing to `/api/cron`.

## How It Works

1. **Business users** sign up and create projects with a Slack channel, daily sync time, and team member handles.
2. At the scheduled time, the bot posts a daily sync message in the chosen Slack channel.
3. **Developers** reply in the thread with their updates.
4. The backend receives thread replies via the Slack Events API, processes them with Gemini AI to extract tasks and generate summaries.
5. Tasks are tracked in a Kanban board (Open / In Progress / Blocked / Closed).
6. After all participants reply or 30 minutes pass, the bot sends follow-ups for unmentioned open/in-progress tasks.
7. Business users can query the AI from the dashboard for insights like "What's blocking the frontend team?"

## Features

- **Automated Slack Syncs**: Daily prompts at configurable times.
- **AI Summaries**: Gemini extracts tasks, blockers, and progress from raw messages.
- **Living Project Context**: The AI appends summaries to a project context that evolves over time.
- **Kanban Board**: Track tasks across statuses.
- **Ask AI**: Natural language queries against project context and recent updates.
- **Smart Follow-ups**: The bot nudges developers about forgotten tasks.
