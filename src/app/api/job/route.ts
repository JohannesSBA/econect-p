import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { publishedJobWhere } from "@/lib/jobFilters";
import { JobStatus, UserRole } from "@/generated/prisma";
import { parseJobInput } from "@/lib/jobValidation";

// GET /api/job
export async function GET(req: NextRequest) {
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
}

// POST /api/job
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Only admins/recruiters can create directly; employers must use /api/employer/jobs
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Only admins or recruiters can post here" }, { status: 403 });
  }
  let parsed;
  try {
    parsed = parseJobInput(await req.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
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
}
