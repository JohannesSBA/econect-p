# Econnect – Ethiopia's LinkedIn (Deployment-Ready Starter)

A full-stack professional networking platform tailored for Ethiopia. Econnect ships with a Next.js 14 App Router frontend, Prisma + PostgreSQL data layer, Socket.IO real-time messaging, AWS S3 uploads, Chapa-powered employer payments, and full localisation in English (en), Amharic (am), and Afaan Oromo (om).

---

## Tech Stack & Highlights
- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui components, localisation dictionaries in `src/app/dictionaries`.
- **Backend**: Next.js API routes with Zod validation, Prisma ORM, NextAuth (credentials + extensible for OAuth).
- **Database**: PostgreSQL 16 (local Docker Compose or managed service in production).
- **Real-time**: Dedicated Socket.IO server (`server.js`) consumed by the client SDK in `src/lib/socket.ts`.
- **Storage**: Direct-to-S3 uploads with the AWS SDK; cover letters, resumes, and profile assets stored under user-specific prefixes.
- **Payments**: Chapa integration for employer subscriptions/credits with initiation, verification, and webhook handling.
- **Quality**: Vitest unit tests, Playwright e2e smoke tests, ESLint, Prettier, GitHub Actions CI, and rate limiting helpers.

---

## Core Features
- Real-time threaded messaging with reactions, typing indicators, push notifications, file attachments, and search.
- LinkedIn-style feed with rich media posts, reactions, comments, bookmarking, and reporting.
- Role-based access control (Admin, Employer, Job Seeker, Recruiter, Moderator) enforced in middleware and API routes.
- Employer dashboard, job posting workflow, applications tracking, and Chapa paywall.
- Resume/Cover letter management with S3 uploads and secure download URLs.
- Profile editing (experience, education, skills, photo uploads) with localisation-aware UI.
- Notifications center with multi-channel delivery (in-app + push).

---

## Repository Layout
```
.
├─ prisma/                  # Prisma schema, migrations, and seed script
├─ public/                  # Static assets (logos, icons, etc.)
├─ src/
│  ├─ app/                  # Next.js App Router (routes, API handlers, layouts)
│  ├─ components/           # Reusable UI components (shadcn/ui, feature modules)
│  ├─ lib/                  # Socket helpers, S3 utilities, payments, auth
│  ├─ types/                # Shared TypeScript types
│  └─ utils/                # Utility helpers (formatters, validators)
├─ tests/                   # Vitest suites
├─ e2e/                     # Playwright specs
├─ server.js                # Socket.IO server entrypoint
├─ docker-compose.yml       # Local Postgres + pgAdmin setup
├─ start-dev.sh             # Starts Socket.IO + Next.js together
├─ QUICK_START.md           # Hands-on walkthrough for contributors
└─ README.md
```

---

## Prerequisites
- Node.js 20+
- npm 10+
- Docker Desktop (for local Postgres via `docker compose`)
- OpenSSL (generate local secrets as needed)

---

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy environment template**
   ```bash
   cp .env.example .env
   ```
3. **Bring up Postgres locally**
   ```bash
   docker compose up -d
   ```
4. **Generate Prisma client + apply schema**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. **Seed baseline data (admin, demo users, sample jobs)**
   ```bash
   npm run seed
   ```
6. **Start the full development stack**
   ```bash
   npm run dev       # runs start-dev.sh → Socket.IO + Next.js
   ```
   The app becomes available at [http://localhost:3000/en](http://localhost:3000/en). Switch locales via the language selector.

**Split servers manually?**
```bash
npm run ws        # WebSocket server on ws://localhost:3002
npm run dev:next  # Next.js (Turbopack)
```

---

## Environment Variables (`.env.example`)
```ini
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/econnect?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_me

# Seed admin credentials
SEED_ADMIN_EMAIL=admin@econnect.et
SEED_ADMIN_PASSWORD=ChangeMe123!

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=econnect-assets
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
S3_PUBLIC_URL=https://econnect-assets.s3.amazonaws.com

# WebSocket server
WS_PORT=3002
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3002

# Chapa
CHAPA_PUBLIC_KEY=CHAPUB_xxx
CHAPA_SECRET_KEY=CHASEC_xxx
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_RETURN_URL=http://localhost:3000/en/employer/dashboard
CHAPA_CALLBACK_URL=http://localhost:3000/api/webhooks/chapa
WEBHOOK_SECRET=dev_webhook_secret

# Email / Notifications
RESEND_KEY=your_resend_api_key
RESEND_FROM="Econnect <no-reply@econnect.et>"
```

The runtime automatically falls back to legacy env names (`S3ACCESS_KEY_ID`, `S3SECRET_ACCESS_KEY`, `BUCKET_NAME`) if present, so migration is smooth.

---

## npm Scripts
- `npm run dev` – Boot Socket.IO + Next.js together (uses `start-dev.sh`).
- `npm run ws` – Socket.IO server only (`server.js`).
- `npm run dev:next` – Next.js dev server with Turbopack.
- `npm run build` / `npm run start` – Production build and serve.
- `npm run lint` – ESLint with Next.js rules.
- `npm test` / `npm run test:watch` – Vitest suites.
- `npm run test:e2e` – Playwright tests (requires `npm run build && npm run start` in another terminal).
- `npm run test:e2e:report` – View last Playwright report.

---

## Real-Time Messaging
- Socket.IO server: `server.js` (configurable via `WS_PORT`).
- Client SDK: `src/lib/socket.ts` handles connecting with auth handshake, presence, typing indicators, and reactions events.
- Messaging UI: `src/app/[lang]/(protected)/components/MessagingInterface.tsx` with threaded conversations, attachments, and push notifications wired through `src/lib/push-notifications.ts`.
- WebSocket tests: `tests/websocket.client.test.ts` covers client/server handshake defaults.

Run messaging end-to-end locally by starting the stack with `npm run dev`, then opening two browsers on `/en/chat`.

---

## File & Media Uploads
- Upload APIs live under `src/app/api/upload` and leverage `src/lib/s3-upload.ts`.
- Resume/Profile helpers (`uploadResume`, `uploadImage`, etc.) unify S3 key generation.
- Ensure `AWS_*` credentials or legacy `S3*` envs are set before uploading. The helper throws descriptive errors if credentials are missing.

---

## Jobs, Applications & Payments
- Prisma models: `prisma/schema.prisma` (JobListing, EmployerProfile, Payment, etc.).
- Employer-only APIs guard creation flows (`src/app/api/employer/*`).
- Chapa flows:
  - `POST /api/payments/chapa/initiate` – create `Payment` + obtain Chapa checkout URL.
  - `POST /api/payments/chapa/verify` – poll Chapa after redirect.
  - `POST /api/webhooks/chapa` – webhook entry secured via `WEBHOOK_SECRET` header.
- Successful payments unlock job publication for the employer dashboard (`src/app/[lang]/employer/dashboard/page.tsx`).

---

## Localisation
- Dictionaries located in `src/app/dictionaries/{en,am,om}.json`.
- Locale-aware routing lives at `src/app/[lang]/*`; middleware (`src/middleware.ts`) enforces locale prefix and RBAC.
- Extend translations by editing dictionary JSON files and consuming them via the localisation utilities in `src/app/dictionaries/index.ts`.

---

## Testing & QA
- **Unit tests**: `npm test` (Vitest) with coverage via `@vitest/coverage-v8`.
- **End-to-end**: `npm run test:e2e` (Playwright). Configure base URL and auth fixtures in `playwright.config.ts`.
- **CI**: `.github/workflows/ci.yml` installs deps (`npm ci`), runs Prisma generate, lints, runs tests, and builds.

Before pushing, run:
```bash
npm run lint
npm test
npm run test:e2e
```

---

## Deployment (AWS-first reference)
1. **Database**: Provision Amazon RDS PostgreSQL 16. Set `DATABASE_URL`, run `npx prisma migrate deploy` during build.
2. **Storage**: Create S3 bucket (e.g., `econnect-assets`). Apply CORS for PUT/GET, enable CloudFront for CDN delivery.
3. **Next.js App**: Deploy to AWS Amplify or ECS Fargate. Build command example:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```
   Set required env vars in the Amplify console (including `NEXT_PUBLIC_SOCKET_URL`).
4. **Socket.IO**: Deploy `server.js` on an EC2 instance (Node 20 + PM2). Front with Nginx and TLS at `wss://realtime.econnect.et`.
5. **Payments**: Configure Chapa dashboard return + callback URLs to your production domains.
6. **Domains**: Point `app.econnect.et` → Amplify and `realtime.econnect.et` → EC2 load balancer/instance.

---

## Roadmap / Next Steps
1. Connection suggestions & graph-powered recommendations.
2. Advanced search (Postgres full-text + pg_trgm) across users, jobs, and posts.
3. Rich media workflows (image/video transcoding, thumbnails via Lambda@Edge).
4. Admin moderation portal for reports, content review, and user suspensions.
5. Analytics dashboard (privacy-preserving metrics for employers and admins).
6. Optional SMS-based login/verification through Ethio-Telecom or Firebase.
7. Resume parsing & job matching via AWS Textract and custom scoring.

---

Built with ❤️ for Ethiopia’s professionals. Plug in your credentials, deploy to your preferred AWS stack, and iterate confidently.
