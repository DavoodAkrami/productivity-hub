# Productivity Hub

A Next.js productivity app that combines bookmarks, to-do management, notes, AI chat, and account/admin tools in one interface.

## What This Project Includes

- Landing page, login, and signup flows
- Supabase authentication (email/password + Google OAuth)
- Main workspace pages:
  - Bookmarks
  - To-Do + Notes workspace
  - AI assistant
  - Profile (account, analytics, admin tools)
- Notification system with variants and undo support
- Admin management:
  - View users
  - Search by name/email
  - Promote/demote admin
  - Delete user accounts
- Profile analytics:
  - Bookmarks count
  - Notes count
  - Average tasks done per day
  - Task completion chart by date range

## Tech Stack (Exact)

### Framework & Language
- Next.js `15.5.9`
- React `19.1.0`
- TypeScript `^5`

### State & Data
- Redux Toolkit `^2.11.2`
- React Redux `^9.2.0`
- Supabase JS `^2.95.3`
- Browser localStorage (cache/fallback in selected flows)

### AI
- OpenAI SDK `^6.17.0`

### UI & Styling
- Tailwind CSS `^4`
- Motion `^12.23.12`
- Recharts `^3.7.0`
- React Icons `^5.5.0`
- clsx `^2.1.1`

### Tooling
- ESLint `^9`
- eslint-config-next `15.5.2`
- PostCSS via `@tailwindcss/postcss`

## Project Structure

```text
src/
  app/
    page.tsx                    # Landing page
    login/page.tsx              # Login page
    signup/page.tsx             # Signup page
    (main)/
      layout.tsx                # Main app layout + sidebar
      bookmarks/page.tsx
      todolist/page.tsx
      AI/page.tsx
      AI/layout.tsx
      profile/page.tsx
    api/
      admin/users/route.ts
      admin/users/[id]/route.ts
      auth/delete-account/route.ts
  components/
  lib/
    auth/
    supabase/
    undoManager.ts
  store/
```

## Environment Variables

Create `.env` (or `.env.local`) in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is required for server-side admin APIs (`/api/admin/*`, delete account route).
- Never expose service role key to the browser.

## Setup

1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
```

3. Open app

```text
http://localhost:3000
```

## Build & Validate

```bash
npm run lint
npm run build
```

## Supabase Requirements

At minimum, this app expects:
- Supabase Auth enabled (Email + Google if needed)
- `profiles` table with a `role` field (`user` / `admin`) for admin gating
- RLS and policies matching your security model

Current app logic also reads/writes user-scoped data for:
- bookmarks
- todos
- notes
- labels
- ai chats/messages

## Important Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` only on server environments.
- Do not place service role values in client-side code.
- Use HTTPS and production-safe redirect URLs for auth providers.

