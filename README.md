# Econnect

**The career network built for Ethiopia.**

Econnect brings job seekers, employers, and professionals onto one trusted platform. It is a mobile-first place to show your work, find opportunities, and stay in touch—designed for Ethiopia’s job market, including people who are new to professional networking online.

---

## What you can do

### Find work
Browse jobs across Ethiopia, filter what fits, and apply with a profile, resume, and cover letter. Track every application from pending through interview, offer, or hire.

### Hire
Create a company page, post openings, and review applicants in one dashboard. Publish featured listings when you are ready to reach more candidates.

### Build a professional presence
Set up a profile with your headline, photo, experience, education, and skills. Follow companies, bookmark jobs and posts, and keep your career story in one place.

### Grow your network
Connect with people you know, accept or decline requests, and message contacts in real time—including reactions, file sharing, and search across conversations.

### Stay in the conversation
Share updates on a public feed (text, images, links, and articles), comment and like posts, save what matters, and get notified when someone reaches out or your application moves forward.

---

## Who it is for

**Job seekers** who want a local, approachable way to be found and to apply.

**Employers** who need a straightforward path from posting a role to talking with candidates.

**Recruiters and professionals** who want to stay visible, follow companies, and keep conversations going.

**Admins and reviewers** who keep the community safe—approving jobs, verifying employers, and handling reports.

---

## Built around Ethiopia

- Guided onboarding so professional networking feels familiar, not intimidating
- English, Amharic, and Afaan Oromo
- Payments for job posts and related products through Chapa
- Mobile-first design for the way people actually get online

---

## Get started

1. Create an account and choose how you use Econnect (job seeker, employer, or similar).
2. Complete your profile or company page.
3. Apply to jobs, post a role, or start connecting and messaging.

---

## How it is built

Econnect is a TypeScript web app. The product UI and most APIs live in **Next.js** (App Router) with **React** and **Tailwind CSS**. Pages are grouped by audience: public auth, signed-in feed/jobs/chat/profile, employer dashboards, and admin tools. Shared UI sits in `src/components`; domain screens hang off `src/features`.

Business rules stay in **services** (`src/services`), not in route handlers. API routes validate input with **Zod**, check roles through shared auth helpers, then call those services. **NextAuth** issues sessions; middleware and route guards keep job seekers, employers, and admins on the right surfaces.

Data lives in **PostgreSQL**, modeled and queried with **Prisma**. That covers users, profiles, jobs, applications, posts, connections, notifications, and payments. Uploads (resumes, photos, chat files) go to **Amazon S3**. Employer checkout uses **Chapa**. Live chat, presence, and typing run on a dedicated **Socket.IO** server beside the Next.js app. Email goes through **Resend**; copy is localized (English, Amharic, Afaan Oromo).

Tests use **Vitest** for services and APIs and **Playwright** for end-to-end flows. Local setup, environment variables, and deployment notes are in [QUICK_START.md](QUICK_START.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
