# KadoTV

Production-oriented streaming frontend built with Vite + React + Supabase.

## 1. Install

```bash
npm install
```

## 2. Supabase

Open `supabase/schema.sql` and run it in the Supabase SQL Editor.

Then configure Authentication > Providers > Email and make sure Email OTP is enabled.

## 3. Environment

Copy `.env.example` to `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use only the Supabase publishable key in the browser. Never put a service_role/secret key into Vite.

## 4. First admin

Create/login to your first account. In Supabase Dashboard > Authentication > Users, set that user's **app_metadata** to:

```json
{"role":"admin"}
```

Sign out and sign in again so the JWT gets refreshed.

The admin UI will then be available at `/admin`.

## 5. Run

```bash
npm run dev
```

## 6. Vercel

Import the repository/project into Vercel and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

`vercel.json` already contains the SPA rewrite so React Router routes work after refresh.

## Important

KadoTV intentionally contains no demo/mock channels, movies, series, users, stream URLs, or fake statistics. Add your real catalogue from the admin panel after configuring Supabase.

The player supports HLS/M3U8 streams through hls.js when the source is an HLS URL. Other browser-supported media URLs can also be used.
