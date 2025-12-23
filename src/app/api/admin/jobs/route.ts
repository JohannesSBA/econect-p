import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!me || me.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const pendingJobs = await prisma.jobListing.findMany({
    where: {
      status: JobStatus.UNDER_REVIEW,
    },
    orderBy: { createdAt: "desc" },
    include: {
      employer: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ pendingJobs });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const body = await req.json();
  const { jobId, action } = body as {
    jobId?: string;
    action?: "approve" | "reject" | "feature" | "unfeature";
  };
  if (!jobId || !action) {
    return NextResponse.json(
      { error: "jobId and action are required" },
      { status: 400 },
    );
  }

  switch (action) {
    case "approve": {
      const job = await prisma.jobListing.update({
        where: { id: jobId },
        data: {
          status: JobStatus.OPEN,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, job });
    }
    case "reject": {
      const job = await prisma.jobListing.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PAUSED,
          isPublished: false,
        },
      });
      return NextResponse.json({ success: true, job });
    }
    case "feature": {
      const job = await prisma.jobListing.update({
        where: { id: jobId },
        data: { isFeatured: true },
      });
      return NextResponse.json({ success: true, job });
    }
    case "unfeature": {
      const job = await prisma.jobListing.update({
        where: { id: jobId },
        data: { isFeatured: false },
      });
      return NextResponse.json({ success: true, job });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

