# LaunchKit

LaunchKit helps new entrepreneurs turn business ideas into professional, ready-to-launch businesses by bringing business planning, branding, website creation, and launch preparation into one workspace.

## Requirements

- Node.js compatible with the installed Next.js version
- A Supabase project

## Environment variables

Create `.env.local` in the project root using `.env.example` as a guide. Add these three variables to both your local `.env.local` and Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase server-side secret/service-role key. This must remain server-only; never add `NEXT_PUBLIC_` to this key and never commit its actual value.

After adding or changing Vercel environment variables, redeploy the project so the deployment receives them.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build

```bash
npm run build
npm run start
```

## Deploy

Import the GitHub repository into Vercel, configure the three environment variables above, and deploy. If Vercel is already connected to the repository, pushing a commit to the configured branch (usually `main`) triggers a new deployment. Check the deployment logs if the build fails.

## Database

Apply `supabase/migrations/001_initial_schema.sql` to your Supabase project before using project/dashboard features.
