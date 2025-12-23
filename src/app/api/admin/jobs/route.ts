import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { JobStatus, Prisma } from "@/generated/prisma";

const DEFAULT_PAGE_SIZE = 10;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true },
  });
  if (!me || me.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return me;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const { searchParams } = new URL(req.url);
  const statusParam =
    (searchParams.get("status") as JobStatus | "all" | null) ??
    JobStatus.UNDER_REVIEW;
  const search = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );

  const where: Prisma.JobListingWhereInput = {};
  if (statusParam && statusParam !== "all") {
    where.status = statusParam;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [pendingJobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        employer: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return NextResponse.json({
    jobs: pendingJobs,
    page,
    pageSize,
    total,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await (async () => {
    try {
      return await requireAdmin();
    } catch (response) {
      if (response instanceof NextResponse) return response;
      throw response;
    }
  })();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { jobId, jobIds, action } = body as {
      jobId?: string;
      jobIds?: string[];
      action?: "approve" | "reject" | "feature" | "unfeature";
      reason?: string;
    };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const ids = Array.isArray(jobIds)
      ? jobIds.filter(Boolean)
      : jobId
        ? [jobId]
        : [];

    if (!ids.length || !action) {
      return NextResponse.json(
        { error: "jobIds/jobId and action are required" },
        { status: 400 },
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updates = await prisma.$transaction(
      ids.map((id) => {
        switch (action) {
          case "approve":
            return prisma.jobListing.update({
              where: { id },
              data: {
                status: JobStatus.OPEN,
                isPublished: true,
                publishedAt: now,
                reviewedAt: now,
                reviewedById: admin.id,
                reviewNote: reason || null,
              },
            });
          case "reject":
            return prisma.jobListing.update({
              where: { id },
              data: {
                status: JobStatus.PAUSED,
                isPublished: false,
                reviewedAt: now,
                reviewedById: admin.id,
                reviewNote: reason,
              },
            });
          case "feature":
            return prisma.jobListing.update({
              where: { id },
              data: {
                isFeatured: true,
                reviewedAt: now,
                reviewedById: admin.id,
              },
            });
          case "unfeature":
            return prisma.jobListing.update({
              where: { id },
              data: {
                isFeatured: false,
                reviewedAt: now,
                reviewedById: admin.id,
              },
            });
          default:
            throw new Error("Unknown action");
        }
      }),
    );

    await prisma.adminAuditLog.createMany({
      data: ids.map((id) => ({
        actorId: admin.id,
        action: `JOB_${action.toUpperCase()}`,
        targetType: "job",
        targetId: id,
        details: reason ? { reason } : null,
      })),
    });

    return NextResponse.json({ success: true, jobs: updates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to update jobs. Please try again." },
      { status: 500 },
    );
  }
}
