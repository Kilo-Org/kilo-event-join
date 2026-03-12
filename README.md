# Kilo Event Join

A Kahoot-style realtime event participation system. Attendees scan a QR code to join an event, and the presenter sees live participant counts and a feed of recent signups updating in real-time.

## Features

- 📱 **Join Page** (`/join`) - Attendees enter their email and name to join
- 📊 **Live Page** (`/live`) - Presenter display with QR code, live count, and signup feed
- ⚡ **Realtime Updates** - Both pages update instantly when someone joins (no refresh needed)
- 🔒 **Duplicate Prevention** - Users can't join the same event twice with the same email

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Postgres + Realtime subscriptions)
- **Tailwind CSS** + **shadcn/ui**
- **react-qr-code** for QR generation

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for Supabase local dev)
- Supabase CLI

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kilo-event-join.git
   cd kilo-event-join
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Supabase locally:
   ```bash
   supabase start
   ```

4. Copy the env file and update with Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   Update with the URL and anon key from `supabase start` output.

5. Apply database migrations:
   ```bash
   supabase db reset
   ```

6. Start the dev server:
   ```bash
   npm run dev
   ```

7. Open:
   - Presenter view: http://localhost:3000/live
   - Join page: http://localhost:3000/join

### Testing Realtime

1. Open `/live` in one browser window
2. Open `/join` in another (or on your phone)
3. Submit the join form
4. Watch the `/live` page update instantly! 🎉

## Database Schema

```sql
-- Events table
create table events (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Attendees table
create table attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  email text not null,
  name text,
  joined_at timestamptz default now(),
  unique(event_id, email)
);
```

## MVP Notes

This is an MVP focused on making realtime work flawlessly. Currently uses a hardcoded event code (`KILO2024`). Future improvements could include:

- Event creation/management UI
- Dynamic event codes via URL
- Authentication for presenters
- Export attendee list
- Animated join notifications

## License

MIT
