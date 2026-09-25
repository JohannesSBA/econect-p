import { NextRequest, NextResponse } from "next/server";

import { JobStatus } from "@/generated/prisma";
import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listJobs, updateJobs } from "@/services/adminJobs";
import { HttpError } from "@/lib/errors";

const DEFAULT_PAGE_SIZE = 10;

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();

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

  const { jobs, total } = await listJobs({ search, status: statusParam, page, pageSize });

  return NextResponse.json({ jobs, page, pageSize, total });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();

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
    throw new HttpError(400, "jobIds/jobId and action are required");
  }

  if (action === "reject" && !reason) {
    throw new HttpError(400, "Rejection reason is required");
  }

  const updates = await updateJobs({ adminId: admin.id, ids, action, reason });
  return NextResponse.json({ success: true, jobs: updates });
});
