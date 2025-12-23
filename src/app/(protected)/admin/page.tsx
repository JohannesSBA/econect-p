import { redirect } from "next/navigation";
import Header from "../components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsChart } from "./components/AnalyticsChart";
import { AdminUserTable } from "./components/AdminUserTable";
import { RoleDistributionCard } from "./components/RoleDistributionCard";
import { ModerationPanel } from "./components/ModerationPanel";
import { JobsPanel } from "./components/JobsPanel";
import { PaymentsPanel } from "./components/PaymentsPanel";
import { Activity, MessageSquare, ShieldCheck, Wallet } from "lucide-react";
import { User } from "@/../types/prisma";
import { Prisma, JobStatus } from "@/generated/prisma";
import { formatCurrency } from "./utils";

type MonthlySnapshot = {
  label: string;
  users: number;
  messages: number;
  payments: number;
  revenue: number;
};

async function getMonthlySnapshots(months = 6): Promise<MonthlySnapshot[]> {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const rows = await prisma.$queryRaw<
    {
      bucket: Date;
      users: Prisma.Decimal | bigint | number;
      messages: Prisma.Decimal | bigint | number;
      payments: Prisma.Decimal | bigint | number;
      revenue: Prisma.Decimal | bigint | number;
    }[]
  >(Prisma.sql`
    WITH months AS (
      SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * generate_series(0, ${months - 1})) AS bucket
    ),
    user_stats AS (
      SELECT date_trunc('month', "createdAt") AS bucket, COUNT(*) AS count
      FROM "User"
      WHERE "createdAt" >= ${fromDate}
      GROUP BY 1
    ),
    message_stats AS (
      SELECT date_trunc('month', "created_at") AS bucket, COUNT(*) AS count
      FROM "Message"
      WHERE "created_at" >= ${fromDate}
      GROUP BY 1
    ),
    payment_stats AS (
      SELECT
        date_trunc('month', "createdAt") AS bucket,
        COUNT(*) FILTER (WHERE "status" = 'PAID') AS count,
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PAID'), 0) AS revenue
      FROM "Payment"
      WHERE "createdAt" >= ${fromDate}
      GROUP BY 1
    )
    SELECT
      m.bucket,
      COALESCE(u.count, 0) AS users,
      COALESCE(msg.count, 0) AS messages,
      COALESCE(pay.count, 0) AS payments,
      COALESCE(pay.revenue, 0) AS revenue
    FROM months m
    LEFT JOIN user_stats u ON u.bucket = m.bucket
    LEFT JOIN message_stats msg ON msg.bucket = m.bucket
    LEFT JOIN payment_stats pay ON pay.bucket = m.bucket
    ORDER BY m.bucket ASC;
  `);

  return rows.map((row) => ({
    label: row.bucket.toLocaleString(undefined, {
      month: "short",
      year: "numeric",
    }),
    users: Number(row.users),
    messages: Number(row.messages),
    payments: Number(row.payments),
    revenue: Number(row.revenue),
  }));
}

function formatDelta(value: number) {
  if (value === 0) return { label: "0 vs last month", tone: "text-slate-500" };
  const label = `${value > 0 ? "+" : ""}${value} vs last month`;
  const tone = value > 0 ? "text-emerald-600" : "text-rose-600";
  return { label, tone };
}

export default async function AdminDashboardPage() {
  const user = (await getCurrentUser()) as unknown as User | null;

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    stats,
    snapshots,
    recentUsersRaw,
    recentPaymentsRaw,
    roleGroups,
    moderationCounters,
    reportedPostsRaw,
    recentCommentsRaw,
    pendingJobsRaw,
    unverifiedEmployersRaw,
  ] = await Promise.all([
    prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYER" } }),
      prisma.message.count(),
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
    ]),
    getMonthlySnapshots(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        role: true,
        createdAt: true,
        isSuspended: true,
        suspendedAt: true,
        shadowBanned: true,
        employerProfile: {
          select: { companyName: true, isVerified: true },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            jobListings: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        product: true,
        employer: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
        createdAt: true,
      },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
    Promise.all([
      prisma.connection.count({ where: { status: "PENDING" } }),
      prisma.messageRequest.count({ where: { status: "PENDING" } }),
      prisma.postReport.count(),
    ]),
    prisma.post.findMany({
      where: { reports: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: { select: { id: true, name: true, email: true } },
        reports: { select: { id: true, reason: true } },
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { id: true, name: true } },
        post: { select: { id: true, title: true } },
      },
    }),
    prisma.jobListing.findMany({
      where: { status: JobStatus.UNDER_REVIEW },
      orderBy: { createdAt: "desc" },
      include: {
        employer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.employerProfile.findMany({
      where: { isVerified: false },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const [totalUsers, totalEmployers, totalMessages, totalPayments, sumPayments] =
    stats;

  const recentUsers = recentUsersRaw.map((entry) => ({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    role: entry.role,
    location: entry.location,
    createdAt: entry.createdAt.toISOString(),
    isSuspended: entry.isSuspended,
    suspendedAt: entry.suspendedAt ? entry.suspendedAt.toISOString() : null,
    shadowBanned: entry.shadowBanned,
    employerProfile: entry.employerProfile
      ? {
          companyName: entry.employerProfile.companyName,
          isVerified: entry.employerProfile.isVerified,
        }
      : null,
    stats: {
      posts: entry._count.posts,
      comments: entry._count.comments,
      jobListings: entry._count.jobListings,
    },
  }));

  const recentPayments = recentPaymentsRaw.map((entry) => ({
    id: entry.id,
    amount: entry.amount,
    currency: entry.currency,
    status: entry.status,
    product: entry.product,
    createdAt: entry.createdAt.toISOString(),
    employer: entry.employer,
    job: entry.job,
  }));

  const reportedPosts = reportedPostsRaw.map((post) => ({
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isVisible: post.isVisible,
    moderationReason: post.moderationReason,
    author: post.author,
    reports: post.reports,
  }));

  const recentComments = recentCommentsRaw.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    isVisible: comment.isVisible,
    moderationReason: comment.moderationReason,
    user: comment.user,
    post: comment.post,
  }));

  const pendingJobs = pendingJobsRaw.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    createdAt: job.createdAt.toISOString(),
    isFeatured: job.isFeatured,
    employer: job.employer,
  }));

  const pendingEmployers = unverifiedEmployersRaw.map((profile) => ({
    id: profile.id,
    companyName: profile.companyName,
    isVerified: profile.isVerified,
    user: profile.user,
  }));

  const revenue = sumPayments._sum.amount ?? 0;
  const roleDistribution = roleGroups
    .map((group) => ({
      role: group.role,
      count: group._count.role,
    }))
    .sort((a, b) => b.count - a.count);

  const [pendingConnections, pendingMessageRequests, pendingReports] =
    moderationCounters;

  const latestSnapshot = snapshots[snapshots.length - 1] ?? {
    users: 0,
    messages: 0,
    payments: 0,
    revenue: 0,
  };
  const previousSnapshot = snapshots[snapshots.length - 2] ?? {
    users: 0,
    messages: 0,
    payments: 0,
    revenue: 0,
  };
  const userDelta = formatDelta(latestSnapshot.users - previousSnapshot.users);
  const messageDelta = formatDelta(
    latestSnapshot.messages - previousSnapshot.messages,
  );
  const paymentDelta = formatDelta(
    latestSnapshot.payments - previousSnapshot.payments,
  );

  const chartData = {
    users: snapshots.map((snapshot) => ({
      label: snapshot.label,
      value: snapshot.users,
    })),
    messages: snapshots.map((snapshot) => ({
      label: snapshot.label,
      value: snapshot.messages,
    })),
    payments: snapshots.map((snapshot) => ({
      label: snapshot.label,
      value: snapshot.payments,
    })),
  };

  const headerUser = {
    id: user.id,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    image: user.image ?? undefined,
    headline: undefined,
    role: user.role ?? undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={headerUser} />
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <Badge className="w-fit bg-blue-600 text-white">
              Admin Control Center
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900">
              Operational Overview
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Monitor platform health, review membership activity, and take
              action on accounts without reaching for Prisma Studio.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total members
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">
                  {totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">
                  {totalEmployers.toLocaleString()} employers
                </p>
                <p className={`text-xs ${userDelta.tone}`}>{userDelta.label}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Messages sent
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">
                  {totalMessages.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">All-time total</p>
                <p className={`text-xs ${messageDelta.tone}`}>
                  {messageDelta.label}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Paid transactions
                </CardTitle>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">
                  {totalPayments.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">
                  {formatCurrency(revenue)} processed
                </p>
                <p className={`text-xs ${paymentDelta.tone}`}>
                  {paymentDelta.label}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Security
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">
                  Admin access
                </div>
                <p className="text-xs text-slate-500">
                  Only administrators can view this surface
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <AnalyticsChart
              title="Monthly sign-ups"
              description="New members joining the platform"
              data={chartData.users}
              accentClass="bg-blue-500"
            />
            <AnalyticsChart
              title="Monthly messages"
              description="Total messages sent per month"
              data={chartData.messages}
              accentClass="bg-indigo-500"
            />
            <AnalyticsChart
              title="Monthly revenue"
              description="Gross processed volume (ETB)"
              data={snapshots.map((snapshot) => ({
                label: snapshot.label,
                value: snapshot.revenue,
                display: formatCurrency(snapshot.revenue),
              }))}
              accentClass="bg-emerald-500"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <AdminUserTable initialUsers={recentUsers} />
            </div>
            <RoleDistributionCard data={roleDistribution} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ModerationPanel
              reportedPosts={reportedPosts}
              recentComments={recentComments}
            />
            <JobsPanel
              pendingJobs={pendingJobs}
              pendingEmployers={pendingEmployers}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <PaymentsPanel initialPayments={recentPayments} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Operations backlog
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Track outstanding requests that need moderator attention.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Pending connections",
                    value: pendingConnections,
                    accent: "text-blue-600",
                  },
                  {
                    label: "Message requests",
                    value: pendingMessageRequests,
                    accent: "text-amber-600",
                  },
                  {
                    label: "Content reports",
                    value: pendingReports,
                    accent: "text-rose-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200/80 bg-white p-3 text-center shadow-sm"
                  >
                    <p className={`text-2xl font-semibold ${item.accent}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
