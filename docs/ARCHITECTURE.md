# Architecture & File Map

This document outlines the `src/` structure and where to look for common concerns.

## High-Level Layout
```
src/
├─ app/                     # Next.js App Router (routes, layouts, API handlers)
│  ├─ api/                  # REST/JSON endpoints (e.g., /api/admin/*, /api/jobs/*)
│  ├─ (protected)/          # Authenticated pages and UI flows
│  ├─ auth/                 # Public auth pages (login/register)
│  ├─ employer/             # Employer-facing routes
│  ├─ providers/            # App-wide providers (e.g., auth/session)
│  └─ globals.css           # Global styles
├─ components/              # Reusable UI (shadcn/ui) and shared widgets
├─ features/                # Domain barrels for easier imports (admin, jobs)
├─ lib/                     # Cross-cutting libs (auth guards, rate limiter, S3, socket, prisma)
├─ types/                   # Shared TypeScript types
└─ utils/                   # Misc utilities (formatters, helpers)
```

## Notable Modules
- **Auth**: `src/app/api/auth/*`, guard helpers in `src/lib/adminAuth.ts`, rate limiting in `src/lib/rateLimiter.ts`.
- **Admin dashboard**: UI components in `src/features/admin` (barrel to `/app/(protected)/admin/components/*`), data utilities in `src/app/(protected)/admin/utils.ts`.
- **Jobs**: UI in `src/features/jobs`, APIs under `src/app/api/job*` and `src/app/api/employer/jobs`.
- **Payments**: Chapa flow in `src/app/api/payments/chapa/*` and webhook in `src/app/api/webhooks/chapa`.
- **Messaging**: APIs under `src/app/api/message*`, socket helpers in `src/lib/socket.ts`, UI in `src/app/(protected)/chat`.
- **Prisma**: Client in `src/lib/prisma.ts`; schema in `prisma/schema.prisma`; migrations in `prisma/migrations`.

## Import Conventions
- Use `@/` alias for imports (e.g., `@/lib/prisma`, `@/features/admin`).
- Prefer feature barrels (`src/features/*`) to avoid long relative paths.
- Keep API payload validation in dedicated helpers (e.g., `src/lib/jobValidation.ts`).
