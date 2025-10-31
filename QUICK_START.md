# 🚀 Quick Start – Econnect Local Stack

Spin up the full experience (Next.js app + Socket.IO server + Postgres) in minutes.

---

## TL;DR
```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```
Visit [http://localhost:3000/en](http://localhost:3000/en) once the terminal shows both the WebSocket server and Next.js server are ready.

---

## 1. Provision Local Infrastructure
- **Database**: `docker compose up -d` launches PostgreSQL 16 + pgAdmin on ports `5432` and `5050`.
- **Secrets**: copy `.env.example` and adjust values. At minimum set:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `CHAPA_*` keys (use sandbox keys during dev)
  - `AWS_*` (or legacy `S3*`) for uploads

Need to reset the stack? Run `docker compose down -v`.

---

## 2. Sync Prisma & Seed Data
Generate the Prisma client and apply the schema:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Seed demo users (admin + sample employer/seeker profiles):
```bash
npm run seed
```
The seeding script prints usable credentials (e.g., `admin@econnect.et / ChangeMe123!`).

---

## 3. Start Development Servers
### Option A – Everything together (recommended)
```bash
npm run dev
```
`start-dev.sh` boots the Socket.IO server first (`ws://localhost:3002`) and then Next.js (`http://localhost:3000`). Both stop when you terminate the process.

### Option B – Run separately
```bash
npm run ws        # Socket.IO only
npm run dev:next  # Next.js only
```
Use this when debugging either service individually.

---

## 4. Explore the App
1. Login at `/en/auth/login` with a seeded account.
2. Head to `/en/(protected)/dashboard` for personalised feed.
3. Open `/en/chat` in two browser windows to test real-time messaging, reactions, and typing indicators.
4. Visit `/en/employer/dashboard` as the seeded employer to create jobs and trigger the Chapa paywall.
5. Upload resumes or profile photos to verify S3 integration.
6. Toggle locales between English, Amharic, and Afaan Oromo via the language switcher in the header.

---

## 5. Validate Quality Gates
| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint (Next + TypeScript rules) |
| `npm test` | Vitest unit suites + coverage |
| `npm run test:e2e` | Playwright smoke tests (requires app running separately) |
| `npm run build` | Production build check |

Before committing, run lint + tests. GitHub Actions (`.github/workflows/ci.yml`) mirrors these steps using `npm ci`.

---

## 6. Helpful Tips
- **Environment tweaks**: set `NEXT_PUBLIC_SOCKET_URL` to match alternate hosts or secure proxies.
- **Webhook sandbox**: configure Chapa sandbox callbacks to `http://localhost:3000/api/webhooks/chapa` using a tunneling tool like `ngrok`.
- **Debugging S3 uploads**: missing credentials throw explicit errors from `src/lib/s3-upload.ts`. Use AWS CLI to verify IAM permissions.
- **Playwright UI mode**: `npm run test:e2e:ui` opens the Playwright runner for interactive debugging.

---

You're ready to build on top of Econnect. Happy hacking! 🎉
