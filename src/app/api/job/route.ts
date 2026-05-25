import { NextRequest, NextResponse } from "next/server";

import { JobStatus } from "@/generated/prisma";
import { withHandler } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/auth";
import { publishedJobWhere } from "@/lib/jobFilters";
import { createJobSchema } from "@/lib/validation/jobs";
import prisma from "@/lib/prisma";

export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const jobs = await prisma.jobListing.findMany({
    where: {
      ...publishedJobWhere,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { employer: true, applications: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(jobs);
});

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  requireRole(user, "ADMIN", "RECRUITER");

  const parsed = createJobSchema.parse(await req.json());

  const job = await prisma.jobListing.create({
    data: {
      ...parsed,
      employerId: user.id,
      status: JobStatus.UNDER_REVIEW,
      isPublished: false,
      publishedAt: null,
    },
  });

  return NextResponse.json(job);
});
