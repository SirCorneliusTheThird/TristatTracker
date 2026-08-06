# TriStat Tracker

A privacy-first dashboard for combining Steam and Epic Games stats, goals, friends, and activity insights.

## Deployment Stack

- Frontend: Vercel
- Backend/Auth: Supabase
- Framework: TanStack Start + React + TypeScript

## Local development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

## Environment variables

Set these before running locally or deploying to Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_APP_URL=<your-public-app-url>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

For Vercel, add the same variables in the project settings under Environment Variables.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase
