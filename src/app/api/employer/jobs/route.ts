import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma";
import { parseJobInput } from "@/lib/jobValidation";

// POST /api/employer/jobs - create a draft job (not published) for employer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (
    !user ||
    (user.role !== "EMPLOYER" &&
      user.role !== "ADMIN" &&
      user.role !== "RECRUITER")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    description,
    company,
    location,
    tags = [],
    salary,
    jobType,
  } = body || {};

  if (!title || !description || !company || !location) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const parsed = parseJobInput({
      title,
      description,
      company,
      location,
      tags,
      salary,
      jobType,
    });

    const job = await prisma.jobListing.create({
      data: {
        ...parsed,
        status: JobStatus.UNDER_REVIEW,
        isPublished: false,
        publishedAt: null,
        employerId: user.id,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
