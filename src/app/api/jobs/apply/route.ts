import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/auth";
import { applyToJob } from "@/services/applications";
import { applyJobSchema } from "@/lib/validation/applications";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  requireRole(user, "JOB_SEEKER");

  const parsed = applyJobSchema.parse(await req.json());

  const application = await applyToJob({
    userId: user.id,
    userName: user.name ?? "Applicant",
    jobId: parsed.jobId,
    coverLetter: parsed.coverLetter,
    resumeUrl: parsed.resumeUrl,
  });

  return NextResponse.json(
    { message: "Application submitted successfully", applicationId: application.id },
    { status: 201 },
  );
});
