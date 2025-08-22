# Econnect

## Setup

1) Install deps
```bash
npm ci
```

2) Env
Create `.env` with:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
NEXTAUTH_SECRET=devsecret

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1

# WebSockets
WS_PORT=3002
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3002

# Chapa
CHAPA_PUBLIC_KEY=pk_test_xxx
CHAPA_SECRET_KEY=sk_test_xxx
WEBHOOK_SECRET=dev_webhook_secret

# Resend (optional)
RESEND_KEY=xxx
RESEND_FROM=no-reply@example.com
```

3) Prisma
```bash
npx prisma generate
# For local dev DB initialize with seed
npx prisma db push
npm run seed
```

4) Run
```bash
npm run ws   # websocket server
npm run dev  # next app
```

## Employer + Chapa

- POST `/api/employer/jobs` creates a draft job (server-side role guard)
- POST `/api/payments/chapa/checkout` returns a hosted_url and persists a Payment with status PENDING
- POST `/api/webhooks/chapa` expects header `x-webhook-signature` equal to `WEBHOOK_SECRET`; marks Payment PAID and publishes the job

Pages:
- `/[lang]/employer/dashboard`
- `/[lang]/employer/jobs/new`

Registration:
- Registration form allows choosing Job Seeker or Employer; Employer creates `EmployerProfile`.

## Tests & CI

- Unit tests with Vitest: `npm test`
- GitHub Actions workflow at `.github/workflows/ci.yml` runs install, prisma generate, build, and tests.

## Webhooks (Production)

Set webhook endpoint to `/api/webhooks/chapa` and use `WEBHOOK_SECRET` for signature in header `x-webhook-signature`.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
