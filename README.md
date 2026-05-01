# Couple Expense Tracker

A no-password, room-based tracker for couples to log "who paid" events by category (without tracking money).

## Stack

- Next.js App Router
- Tailwind CSS
- Lucide React icons
- Prisma ORM
- MongoDB Atlas (M0)
- Shadcn-style UI components

## Features

- Create room or join room with a 6-character room ID (example: `SUN-42`)
- Device-local session via `localStorage` (room ID + display name)
- Fixed categories only: Breakfast, Lunch, Dinner, Groceries, Snacks, Transport, Entertainment
- Action screen with one-tap "I Paid" category buttons
- Stats screen with ranges: Last 1 Day, Last 7 Days, Last 30 Days, All Time
- Recent records list with delete button to remove mistakes

## Prisma Models

- `Room`: `id`, `createdAt`
- `Record`: `id`, `roomId`, `paidBy`, `category`, `createdAt`

Schema file: `prisma/schema.prisma`

## Environment

Create `.env` and set:

```bash
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
```

## Local Development

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000

## API Routes

- `POST /api/rooms`
  - body `{ mode: "create" }` -> creates a room
  - body `{ mode: "join", roomId: "SUN-42" }` -> validates room exists
- `GET /api/records?roomId=SUN-42&range=7d`
  - range: `1d`, `7d`, `30d`, `all`
- `POST /api/records`
  - body `{ roomId, paidBy, category }`
- `DELETE /api/records?id=<recordId>`

## Deploy (Vercel)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add `DATABASE_URL` in Vercel environment variables.
4. Deploy.

No extra server setup is needed.
