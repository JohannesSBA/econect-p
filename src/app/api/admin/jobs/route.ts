import { NextRequest, NextResponse } from "next/server";

import { JobStatus } from "@/generated/prisma";
import { requireAdminUser } from "@/lib/adminAuth";
import { getRequestLogger } from "@/lib/logger";
import { listJobs, updateJobs } from "@/services/adminJobs";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:admin:jobs" });
  try {
    await requireAdminUser();
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

  const { jobs, total } = await listJobs({
    search,
    status: statusParam,
    page,
    pageSize,
  });

  return NextResponse.json({
    jobs,
    page,
    pageSize,
    total,
  });
}

export async function PATCH(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:admin:jobs" });
  const admin = await requireAdminUser();
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

    const updates = await updateJobs({
      adminId: admin.id,
      ids,
      action,
      reason,
    });

    return NextResponse.json({ success: true, jobs: updates });
  } catch (error) {
    logger.error("Unable to update jobs", { error });
    return NextResponse.json(
      { error: "Unable to update jobs. Please try again." },
      { status: 500 },
    );
  }
}
