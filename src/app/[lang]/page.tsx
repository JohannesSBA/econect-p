import type { SVGProps } from "react";

import Link from "next/link";

import Header from "@/components/Header";
import LandingJobListings from "@/components/LandingJobListings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Dictionary } from "@/lib/utils";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Languages,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Upload,
  Users2,
} from "lucide-react";

import { getDictionary } from "./dictionaries";

type IconType = (props: SVGProps<SVGSVGElement>) => JSX.Element;

type CoreFeature = {
  title: string;
  description: string;
  tag: string;
  accent: string;
  Icon: IconType;
};

type PricingTier = {
  name: string;
  price: string;
  subtitle: string;
  billing?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

type PurposePoint = {
  title: string;
  description: string;
};

type TechCapability = {
  label: string;
  details: string;
};

type TeamHighlight = {
  name: string;
  role: string;
  focus: string;
};

type ContactOption = {
  title: string;
  description: string;
  action: string;
  href: string;
  Icon: IconType;
};

const heroHighlights = [
  { value: "40K+", label: "Job seekers building profiles" },
  { value: "6K+", label: "Employers hiring through Econnect" },
  { value: "3", label: "Languages supported end-to-end" },
] as const;

const heroProfiles: ReadonlyArray<{
  name: string;
  role: string;
  tag: string;
  accent: string;
}> = [
  {
    name: "Lulit Bekele",
    role: "Growth Marketer",
    tag: "Addis Ababa",
    accent: "from-sky-100 via-sky-200 to-sky-300",
  },
  {
    name: "Henok Getachew",
    role: "People Operations",
    tag: "Dire Dawa",
    accent: "from-amber-100 via-amber-200 to-amber-300",
  },
  {
    name: "Rahma Mohammed",
    role: "Backend Engineer",
    tag: "Hawassa",
    accent: "from-emerald-100 via-emerald-200 to-emerald-300",
  },
  {
    name: "Kidist Tadesse",
    role: "Creative Lead",
    tag: "Mekelle",
    accent: "from-rose-100 via-rose-200 to-rose-300",
  },
];

const coreFeatures: CoreFeature[] = [
  {
    title: "Profiles & Connections",
    description:
      "Create localized professional profiles, showcase experience, and build trusted connections across Ethiopia.",
    tag: "Networking",
    accent: "from-blue-50 via-indigo-50 to-white",
    Icon: Users2,
  },
  {
    title: "Job Applications",
    description:
      "Employers publish roles and receive qualified applications directly through the platform, end-to-end.",
    tag: "Hiring",
    accent: "from-slate-50 via-slate-100 to-white",
    Icon: Briefcase,
  },
  {
    title: "Real-time Messaging",
    description:
      "Chat powered by Socket.IO connects recruiters, candidates, and mentors instantly to keep opportunities moving.",
    tag: "Chat",
    accent: "from-amber-50 via-orange-50 to-white",
    Icon: MessageCircle,
  },
  {
    title: "Smart Notifications",
    description:
      "Stay informed about new connections, job updates, and application status changes with tailored alerts.",
    tag: "Signals",
    accent: "from-purple-50 via-fuchsia-50 to-white",
    Icon: Bell,
  },
  {
    title: "Localized Onboarding",
    description:
      "Step-by-step guidance supports first-time internet users with clear language, visuals, and simplified flows.",
    tag: "Guided",
    accent: "from-emerald-50 via-emerald-100 to-white",
    Icon: Sparkles,
  },
  {
    title: "Multilingual Experience",
    description:
      "Switch seamlessly between English, Amharic, and Afaan Oromo across content, navigation, and notifications.",
    tag: "Languages",
    accent: "from-teal-50 via-cyan-50 to-white",
    Icon: Languages,
  },
  {
    title: "Payments & Premium",
    description:
      "Chapa-backed payments unlock resume boosts, employer tools, and team collaboration features.",
    tag: "Premium",
    accent: "from-yellow-50 via-yellow-100 to-white",
    Icon: CreditCard,
  },
  {
    title: "Secure File Storage",
    description:
      "Upload CVs and documents with confidence—AWS S3 handles durability while access remains fully controlled.",
    tag: "Documents",
    accent: "from-slate-50 via-slate-200 to-white",
    Icon: Upload,
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: "Open Access",
    price: "Free",
    subtitle: "For every job seeker",
    description:
      "Build a profile, connect with peers, and apply to roles with localized support and guidance.",
    features: [
      "Unlimited job applications",
      "Localized onboarding in 3 languages",
      "Real-time chat with connections",
      "Instant notifications across web & mobile",
    ],
    cta: "Create your profile",
  },
  {
    name: "Job Seeker Plus",
    price: "ETB 199",
    subtitle: "Boosted visibility",
    billing: "/month",
    description:
      "Stand out with prioritized placement, resume boosts, and interview readiness sessions.",
    features: [
      "Chapa-powered secure checkout",
      "Resume boosts in employer searches",
      "Application performance insights",
      "Access to mentorship circles",
    ],
    cta: "Upgrade with Chapa",
    highlighted: true,
  },
  {
    name: "Employer Suite",
    price: "Let’s talk",
    subtitle: "For hiring teams",
    description:
      "Unlock advanced tooling for teams hiring at scale with automation, analytics, and integrations.",
    features: [
      "Unlimited role postings and team seats",
      "Applicant pipelines with collaboration",
      "Analytics dashboards exported via Prisma",
      "Premium support & onboarding concierge",
    ],
    cta: "Book a strategy call",
  },
];

const purposePoints: PurposePoint[] = [
  {
    title: "Close the networking gap",
    description:
      "Many Ethiopians find global platforms intimidating. Econnect delivers a localized, trusted alternative.",
  },
  {
    title: "Empower first-time users",
    description:
      "Guided onboarding makes professional networking approachable—even for people new to the internet.",
  },
  {
    title: "Create a safe ecosystem",
    description:
      "From profiles to applications, every interaction is designed to protect user data and foster credibility.",
  },
];

const techCapabilities: TechCapability[] = [
  {
    label: "Frontend",
    details:
      "Next.js App Router · TypeScript · Tailwind · shadcn/ui components",
  },
  {
    label: "Backend",
    details:
      "Prisma ORM with PostgreSQL, containerized via Docker for local development",
  },
  {
    label: "Infrastructure",
    details:
      "AWS Amplify for hosting, EC2 & RDS for production workloads, S3 for secure file storage",
  },
  {
    label: "Real-time & CI/CD",
    details:
      "Socket.IO messaging, with GitHub Actions delivering automated tests, builds, and deployments",
  },
];

const teamHighlights: TeamHighlight[] = [
  {
    name: "Lulit Bekele",
    role: "Onboarding Coach",
    focus: "Guides first-time users",
  },
  {
    name: "Henok Getachew",
    role: "Employer Success",
    focus: "Optimizes hiring pipelines",
  },
  {
    name: "Rahma Mohammed",
    role: "Platform Reliability",
    focus: "Keeps infrastructure resilient",
  },
  {
    name: "Kidist Tadesse",
    role: "Community Lead",
    focus: "Builds local mentorship circles",
  },
];

const contactOptions: ContactOption[] = [
  {
    title: "Talk to onboarding",
    description:
      "Need help creating a profile or uploading your CV? Our coaches will walk you through.",
    action: "Book a call",
    href: "#contact-form",
    Icon: CalendarCheck,
  },
  {
    title: "Email support",
    description:
      "Questions about payments, language support, or hiring tools? We respond within 24 hours.",
    action: "support@econnect.et",
    href: "mailto:support@econnect.et",
    Icon: Mail,
  },
  {
    title: "Call us",
    description:
      "Prefer to speak directly? Reach our Addis-based team during business hours.",
    action: "+251 911 000 000",
    href: "tel:+251911000000",
    Icon: PhoneCall,
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function LandingPage({
  params,
}: {
  params: { lang: "en" | "am" | "om" };
}) {
  const { lang } = params;
  const dict = (await getDictionary(lang)) as Dictionary;

  const heroTitle = "The career network built for Ethiopia.";
  const heroDescription =
    "Econnect brings job seekers, employers, and professionals onto one trusted platform—localized, multilingual, and guided for every level of experience.";
  const visionStatement =
    "We believe access to opportunity should not depend on geography, language, or familiarity with global tools. Econnect delivers a mobile-first, affordable gateway into Ethiopia's labor market.";

  return (
    <div className="bg-stone-50 text-slate-900">
      <Header lang={lang} />
      <main>
        <section
          id="hero"
          className="relative overflow-hidden bg-gradient-to-br from-white via-stone-100 to-slate-100"
        >
          <div className="absolute inset-x-0 top-[10rem] h-[24rem] bg-gradient-to-b from-blue-100/60 via-transparent to-transparent blur-3xl" />
          <div className="container mx-auto px-4 pb-24 pt-28 lg:pt-32">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-10">
                <Badge className="w-fit rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white shadow">
                  {dict.hero.innovative}
                </Badge>
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                    {heroTitle}
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                    {heroDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={`/${lang}/auth/register`}>
                    <Button
                      size="lg"
                      className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Join the network
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="#contact">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white/80"
                    >
                      Talk to our team
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {heroHighlights.map((highlight) => (
                    <div
                      key={highlight.label}
                      className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur"
                    >
                      <div className="text-3xl font-bold text-slate-900">
                        {highlight.value}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {highlight.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ethiopian talent cloud
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Realtime job feed
                    </span>
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <LandingJobListings lang={lang} />
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {heroProfiles.map((profile) => (
                    <div
                      key={profile.name}
                      className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${profile.accent} p-5 shadow-lg`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                          {profile.tag}
                        </span>
                        <Sparkles className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/80 text-base font-semibold text-slate-700">
                          {getInitials(profile.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {profile.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {profile.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* <div className="mt-16 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Trusted by hiring teams and innovators at
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-500 sm:justify-between">
                {brandPartners.map((partner) => (
                  <span key={partner} className="uppercase tracking-wide">
                    {partner}
                  </span>
                ))}
              </div>
            </div> */}
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white">
                Core features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to connect, hire, and grow—built for
                Ethiopia.
              </h2>
              <p className="text-lg leading-relaxed text-slate-600">
                From multilingual onboarding to real-time chat, Econnect unifies
                the tools job seekers, employers, and professionals need on one
                platform.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {coreFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="relative overflow-hidden border-0 bg-white/90 shadow-xl"
                >
                  <div
                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${feature.accent}`}
                  />
                  <CardContent className="relative flex h-full flex-col justify-between gap-6 p-8">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70 shadow">
                        <feature.Icon className="h-6 w-6 text-slate-700" />
                      </div>
                      <Badge className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {feature.tag}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-950 py-24 text-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium text-white/80">
                Premium services
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Flexible plans for seekers, teams, and growing businesses.
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                Start free, boost your visibility, or power entire hiring teams
                with plans that integrate local payments and enterprise
                controls.
              </p>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {pricingTiers.map((tier) => {
                const isHighlighted = tier.highlighted ?? false;
                const cardClasses = isHighlighted
                  ? "border-amber-300 bg-white text-slate-900 shadow-2xl"
                  : "border-white/10 bg-white/5 text-slate-100 shadow-lg";
                const textMuted = isHighlighted
                  ? "text-slate-600"
                  : "text-slate-300";
                return (
                  <Card
                    key={tier.name}
                    className={`flex h-full flex-col justify-between rounded-3xl border ${cardClasses}`}
                  >
                    <CardContent className="flex flex-1 flex-col gap-6 p-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {tier.subtitle}
                        </p>
                        <h3 className="mt-3 text-3xl font-semibold">
                          {tier.name}
                        </h3>
                        <p
                          className={`mt-3 text-sm leading-relaxed ${textMuted}`}
                        >
                          {tier.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-4xl font-bold">{tier.price}</span>
                        {tier.billing ? (
                          <span className="ml-1 text-sm font-medium text-slate-400">
                            {tier.billing}
                          </span>
                        ) : null}
                      </div>
                      <ul className="space-y-3 text-sm">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <ShieldCheck
                              className={`mt-0.5 h-4 w-4 ${isHighlighted ? "text-emerald-500" : "text-emerald-300"}`}
                            />
                            <span className={textMuted}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-4">
                        <Link href={`/${lang}/auth/register`} className="block">
                          <Button
                            size="lg"
                            className={`w-full rounded-full ${
                              isHighlighted
                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                : "border border-white/40 bg-transparent text-white hover:border-white/60 hover:bg-white/10"
                            }`}
                            variant={isHighlighted ? "default" : "ghost"}
                          >
                            {tier.cta}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-6">
                <Badge className="w-fit rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white">
                  Purpose
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Connecting Ethiopia’s workforce on one trusted platform.
                </h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  {visionStatement}
                </p>
                <div className="space-y-4">
                  {purposePoints.map((point) => (
                    <div
                      key={point.title}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-slate-900">
                        {point.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {point.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-slate-100 shadow-2xl">
                <div className="relative z-10 space-y-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">
                      Tech stack
                    </Badge>
                    <Badge className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                      Infrastructure
                    </Badge>
                    <Badge className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                      Real-time
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white">
                      Built for reliability, speed, and local growth.
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-200">
                      Our stack blends modern frameworks with AWS infrastructure
                      so Econnect can scale from startups to enterprises across
                      Ethiopia.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {techCapabilities.map((capability) => (
                      <div
                        key={capability.label}
                        className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                          {capability.label}
                        </p>
                        <p className="mt-2 text-sm text-white/80">
                          {capability.details}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
                    {teamHighlights.map((talent) => (
                      <div
                        key={talent.name}
                        className="min-w-[180px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/80 text-base font-semibold text-slate-800">
                          {getInitials(talent.name)}
                        </div>
                        <p className="mt-4 text-sm font-semibold text-white">
                          {talent.name}
                        </p>
                        <p className="text-xs text-white/70">{talent.role}</p>
                        <p className="mt-2 text-xs text-white/50">
                          {talent.focus}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-slate-100 py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="space-y-6">
                <Badge className="w-fit rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white">
                  Contact
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  We’re here in Ethiopia to help you get started.
                </h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  Whether you’re uploading your first CV, launching a nationwide
                  hiring program, or integrating Chapa payments, our team is
                  ready to help.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {contactOptions.map((option) => {
                    const isAnchor = option.href.startsWith("#");
                    const content = (
                      <>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
                          <option.Icon className="h-4 w-4 text-slate-500" />
                          <span>{option.title}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {option.description}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          {option.action}
                        </p>
                      </>
                    );

                    if (isAnchor) {
                      return (
                        <Link
                          key={option.title}
                          href={option.href}
                          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <a
                        key={option.title}
                        href={option.href}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div
                id="contact-form"
                className="rounded-3xl border border-white/80 bg-white p-8 shadow-xl"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  Tell us about your goals
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Share how you’d like to use Econnect—our specialists will
                  follow up with a tailored roadmap.
                </p>
                <form className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Full name
                      <input
                        type="text"
                        name="name"
                        placeholder="Jane Doe"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Work email
                      <input
                        type="email"
                        name="email"
                        placeholder="jane@company.com"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        required
                      />
                    </label>
                  </div>
                  <label className="text-sm font-medium text-slate-700">
                    Organisation
                    <input
                      type="text"
                      name="company"
                      placeholder="Your business or team"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    How can we help?
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about the roles you need, languages required, or integrations you're exploring."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </label>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Submit inquiry
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                  E
                </div>
                <span className="text-xl font-bold text-slate-900">
                  Econnect
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {dict.footer.description}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Platform
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <Link href="#features" className="hover:text-slate-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-slate-900">
                    Premium services
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${lang}/auth/register`}
                    className="hover:text-slate-900"
                  >
                    Create profile
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Company
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <Link href="#about" className="hover:text-slate-900">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-slate-900">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${lang}/auth/login`}
                    className="hover:text-slate-900"
                  >
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Get in touch
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <a
                    href="mailto:support@econnect.et"
                    className="hover:text-slate-900"
                  >
                    support@econnect.et
                  </a>
                </li>
                <li>
                  <a href="tel:+251911000000" className="hover:text-slate-900">
                    +251 911 000 000
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
            <p>{dict.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
