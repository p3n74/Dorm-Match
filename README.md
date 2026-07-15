# DormMatch

Web-based dorm finder for students, institutional employees, and dorm owners.

## Stack

- **Frontend:** React, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** Express, tRPC, Better Auth
- **Database:** PostgreSQL, Drizzle ORM

## Development

1. Copy `apps/server/.env.example` to `apps/server/.env` and configure PostgreSQL.
2. Copy `apps/web/.env.example` to `apps/web/.env`.
3. Install and start:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

- Web: http://localhost:3001
- API: http://localhost:3000

## Seed accounts

Default credentials (override via `SEED_*` env vars in `packages/db`):

| Role     | Email                    | Password        |
|----------|--------------------------|-----------------|
| Admin    | admin@dormmatch.test     | AdminPass123!   |
| Tenant   | tenant@dormmatch.test    | TenantPass123!  |
| Landlord | landlord@dormmatch.test  | LandlordPass123! |

## Scripts

- `npm run dev` — web + API
- `npm run db:push` — apply Drizzle schema
- `npm run db:seed` — seed dev data
- `npm test` — unit tests
- `npm run build` — production build
"# dormmatch" 
