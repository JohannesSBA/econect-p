import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getRequestLogger } from "@/lib/logger";
import { listEmployers, updateEmployers } from "@/services/adminEmployers";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:admin:employers" });
  try {
    await requireAdminUser();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

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
}

export async function PATCH(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:admin:employers" });
  const admin = await requireAdminUser();
  if (admin instanceof NextResponse) return admin;

  try {
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
      return NextResponse.json(
        { error: "employerProfileId(s) and action required" },
        { status: 400 },
      );
    }

    if (action === "suspend" && !reason) {
      return NextResponse.json(
        { error: "Suspension reason is required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updates = await updateEmployers({
      adminId: admin.id,
      ids,
      action,
      reason,
    });

    return NextResponse.json({ success: true, profiles: updates });
  } catch (error) {
    logger.error("Unable to update employer(s)", { error });
    return NextResponse.json(
      { error: "Unable to update employer(s). Please try again." },
      { status: 500 },
    );
  }
}
