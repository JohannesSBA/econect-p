import { NextResponse } from "next/server";

import { getRequestLogger } from "@/lib/logger";
import { getLandingJobs } from "@/services/jobs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const logger = getRequestLogger(request, { route: "api:jobs:landing" });

  try {
    const jobs = await getLandingJobs({
      search,
      logger,
    });
    return NextResponse.json(jobs);
  } catch (error) {
    logger.error("Failed to fetch job listings", { error, search: search ?? "" });
    return NextResponse.json(
      { error: "Failed to fetch job listings" },
      { status: 500 },
    );
  }
}
