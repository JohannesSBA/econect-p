---
name: project-arch
description: Econnect app architecture — server layer, auth helpers, validation, testing patterns after May 2026 refactor
metadata:
  type: project
---

Next.js 15 app (src/app) with Prisma + PostgreSQL + NextAuth (JWT/credentials). Ethiopian job platform.

**Auth layer** (`src/lib/auth.ts`): `requireUser()`, `requireAdmin()`, `requireEmployer()`, `requireRole(user, ...roles)`, `requireEmployerOwner(jobId, userId)` — all throw `HttpError`. Session uses `session.user.id` (not email). Use `withHandler` from `src/lib/api.ts` to wrap routes so HttpError/ZodError are caught and returned as JSON.

**Validation schemas** (`src/lib/validation/`): `jobs.ts`, `applications.ts`, `uploads.ts`, `users.ts`, `payments.ts`, `messages.ts`.

**Services** (`src/services/`): `jobs.ts`, `applications.ts`, `payments.ts`, `adminJobs.ts`, `adminEmployers.ts`, `messaging.ts`.

**Prisma enums**: Added `ApplicationStatus` (PENDING/REVIEWING/SHORTLISTED/ACCEPTED/HIRED/REJECTED/WITHDRAWN), renamed `degreeType` → `DegreeType`. Need `prisma migrate dev` to apply.

**Upload security**: `validateUploadFile(file, type)` in `src/lib/validation/uploads.ts` — enforces per-type MIME + size limits.

**Tests** (vitest): 81 passing. Session mocks must include `{ user: { id: '...' } }` — requireUser reads `session.user.id`, not email.

**Why:** Clean separation so business logic is in services, routes are thin handlers, auth is centralized and consistent.
