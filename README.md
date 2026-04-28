# TOS Sentinel

Threat intelligence for the fine print.

TOS Sentinel is a free public Terms of Service and Privacy Policy monitoring platform. It tracks a curated list of approved services, snapshots policy documents, detects meaningful changes, generates evidence-based risk analysis, and requires admin approval before alerts are sent to users.

## Tech stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, and Row Level Security
- Server actions and route handlers for backend operations
- Cheerio, Mozilla Readability, jsdom, and content hashing for policy extraction
- OpenAI-compatible structured JSON analysis validated with Zod
- Resend for email alerts
- Vercel Cron compatible scan endpoint, structured so jobs can move to Trigger.dev or Inngest

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`.

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe client values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser.
- `OPENAI_API_KEY` and `OPENAI_MODEL` enable AI analysis.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` enable outbound alerts.
- `APP_URL` is used in alert links.
- `CRON_SECRET` protects the scan cron endpoint.

## Supabase setup

1. Create a Supabase project.
2. Apply the migration in `supabase/migrations/0001_initial_schema.sql`.
3. Confirm RLS is enabled on all application tables.
4. Configure Supabase Auth email settings for local/deployed URLs.

The migration creates:

- Profiles and role-based access control (`user`, `reviewer`, `admin`)
- Curated tracked services and admin-managed policy documents
- Snapshots, scan logs, policy changes, risk reports, findings, suggestions, subscriptions, and notifications
- RLS policies for public reads, user-owned records, reviewer queues, and admin management
- Seed tracked services without fake analysis

## Running migrations

With the Supabase CLI:

```bash
supabase db push
```

Or paste the migration SQL into the Supabase SQL editor for the project.

## Running the dev server

```bash
npm run dev
```

## Running background jobs

For early MVP deployments, configure Vercel Cron to call:

```text
GET /api/cron/scan
Authorization: Bearer $CRON_SECRET
```

Admins can also trigger scans from `/admin/services/[id]`. The scan pipeline fetches, extracts, normalizes, hashes, snapshots, and only runs AI when content changes or the first snapshot is created.

## Creating the first admin user

1. Sign up through `/auth/sign-in`.
2. In Supabase SQL editor, promote the profile:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

Reviewers can be assigned with `role = 'reviewer'`.

## Adding tracked services

Admins can create and edit tracked services at `/admin/services`. Users can only submit suggestions at `/suggest`; they cannot add crawler URLs directly. Admin approval is required before submitted URLs become policy documents.

## Triggering manual scans

1. Go to `/admin/services/[id]`.
2. Add a policy document URL.
3. Click "Trigger scan".

First snapshots create draft risk reports. Later content-hash changes create pending policy changes with AI findings for admin review.

## AI configuration

Set:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

AI outputs are parsed as strict JSON with Zod schemas. Invalid output is retried once with a repair prompt. If repair fails, the scan fails and requires manual review; invalid analysis is not published.

## Email configuration

Set:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=alerts@example.com
APP_URL=https://your-app.example
```

Email is only sent when an admin publishes a policy change. In-app notifications are deduped by user and policy change.

## Deployment notes

- Deploy on Vercel or another Next.js-compatible host.
- Configure Supabase Auth redirect URLs for production.
- Set all server-only environment variables in the deployment environment.
- Configure a cron trigger for `/api/cron/scan`.
- Keep service-role keys server-only.
- Consider moving scan jobs to Trigger.dev or Inngest as scan volume increases.

## Non-negotiable product boundaries

- Users suggest services only; they do not directly add crawler URLs.
- Only admins create tracked services and policy documents.
- LLM analysis only runs on first snapshot, changed hash, or admin-triggered analysis paths.
- AI findings must include evidence and remain pending until reviewed.
- Users receive alerts only after admin publication.
