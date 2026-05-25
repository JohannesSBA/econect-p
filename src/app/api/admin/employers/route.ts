import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { getRequestLogger } from "@/lib/logger";
import { listEmployers, updateEmployers } from "@/services/adminEmployers";

const DEFAULT_PAGE_SIZE = 10;

export const GET = withHandler(async (req: NextRequest) => {
  const logger = getRequestLogger(req, { route: "api:admin:employers" });
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const search = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );

  const { employers, total } = await listEmployers({
    search,
    status: status as "pending" | "verified" | "all",
    page,
    pageSize,
  });

  return NextResponse.json({ employers, page, pageSize, total });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const logger = getRequestLogger(req, { route: "api:admin:employers" });
  const admin = await requireAdmin();

  const body = await req.json();
  const { employerProfileId, employerProfileIds, action } = body as {
    employerProfileId?: string;
    employerProfileIds?: string[];
    action?: "verify" | "suspend";
    reason?: string;
  };
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const ids = Array.isArray(employerProfileIds)
    ? employerProfileIds.filter(Boolean)
    : employerProfileId
      ? [employerProfileId]
      : [];

  if (!ids.length || !action) {
    throw new HttpError(400, "employerProfileId(s) and action required");
  }
  if (action === "suspend" && !reason) {
    throw new HttpError(400, "Suspension reason is required");
  }

  const updates = await updateEmployers({ adminId: admin.id, ids, action, reason });
  return NextResponse.json({ success: true, profiles: updates });
});
