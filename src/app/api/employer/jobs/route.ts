import { NextRequest, NextResponse } from "next/server";

import { JobStatus } from "@/generated/prisma";
import { withHandler } from "@/lib/api";
import { requireEmployer } from "@/lib/auth";
import { createJobSchema } from "@/lib/validation/jobs";
import prisma from "@/lib/prisma";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireEmployer();

  const parsed = createJobSchema.parse(await req.json());

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
});
