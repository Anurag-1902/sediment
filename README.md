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
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_byte_base64_key_run_openssl_rand_base64_32
GOOGLE_CLIENT_ID=optional_google_oauth_client_id
GOOGLE_CLIENT_SECRET=optional_google_oauth_client_secret
```

**Important:** After deployment on Krut, update `NEXTAUTH_URL` and `APP_URL` to match your deployed public URL exactly (e.g., `https://your-project.projects.krut.ai`).

**Note:** Slack credentials are managed per-user through the dashboard. Each user connects their own Slack workspace via Dashboard → Slack Integration. See the in-app guide for setup steps.

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

Each user connects their own Slack workspace through the in-app guide. As a user:

1. Go to **Dashboard → Slack Integration** in the Sediment app.
2. Follow the **Connection Guide** to create a Slack app from a manifest, install it to your workspace, and paste your credentials.
3. The guide walks you through each step — no env variables needed.

For local development, the app manifest is generated automatically in the dashboard with the correct `APP_URL` baked in.

## Cron Jobs

The app requires **two cron endpoints** to be triggered every minute:

### `/api/cron` — Daily Sync Trigger
Checks every minute for active projects whose `syncTime` matches the current time in their configured `syncTimezone`, then posts a Slack sync message.

### `/api/cron/followups` — Follow-up Trigger
Checks every minute for active sync sessions that were scheduled 28–32 minutes ago. For each session, it finds open/in-progress tasks that were **not** mentioned in any dev update during that session, sends a threaded follow-up to the assigned developer, and marks the session as completed.

For local development, set up two cron entries:

```bash
*/1 * * * * curl -s http://localhost:3000/api/cron > /dev/null 2>&1
*/1 * * * * curl -s http://localhost:3000/api/cron/followups > /dev/null 2>&1
```

For production deployment on Krut, configure two cron triggers pointing to the respective endpoints.

## ProjectMember Slack Handle Resolution

When creating or updating a project, you input Slack handles like `@dev1`. Sediment resolves these to real Slack user IDs internally and stores both:
- `slackUserId`: the resolved ID (e.g., `U01234ABC`) used for Slack API calls
- `slackHandle`: the original handle (e.g., `@dev1`) displayed in the UI

If a handle cannot be resolved, the API returns a `BAD_REQUEST` error naming the invalid handle.

## How It Works

1. **Business users** sign up and create projects with a Slack channel, daily sync time, and team member handles.
2. At the scheduled time, the bot posts a daily sync message in the chosen Slack channel.
3. **Developers** reply in the thread with their updates.
4. The backend receives thread replies via the Slack Events API, processes them with Gemini AI to extract tasks and generate summaries.
5. Tasks are tracked in a Kanban board (Open / In Progress / Blocked / Closed).
6. ~30 minutes after the sync, the follow-up cron sends nudges for unmentioned open/in-progress tasks.
7. Business users can query the AI from the dashboard for insights like "What's blocking the frontend team?"

## Features

- **Automated Slack Syncs**: Daily prompts at configurable times, respecting per-project timezones.
- **AI Summaries**: Gemini extracts tasks, blockers, and progress from raw messages.
- **Living Project Context**: The AI appends summaries to a project context that evolves over time.
- **Kanban Board**: Track tasks across statuses.
- **Ask AI**: Natural language queries against project context and recent updates.
- **Smart Follow-ups**: The bot nudges developers about forgotten tasks.
