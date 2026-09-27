# VisitGarut

Independent local discovery platform for Garut, West Java.

## Stack

- Next.js 15 + React 19 + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Vercel for deployment
- React Native + Expo planned for the mobile app

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the VisitGarut Supabase project.
3. Run `npm install`.
4. Run `npm run dev`.

## Core data model

The initial Supabase schema contains:

- `categories`
- `places`
- `events`
- `profiles`
- `favorites`
- `reviews`

Row Level Security is enabled on all public tables. Public visitors can read published destination/event data, while user-owned records such as favorites and reviews are scoped to authenticated users.

## Product direction

VisitGarut is designed as a mobile-first discovery product covering attractions, food, stays, transport, events, and local businesses. The website is the SEO/GEO acquisition layer; the future Expo app will reuse the same Supabase backend.
