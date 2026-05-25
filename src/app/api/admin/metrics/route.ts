import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GET = withHandler(async (_req: NextRequest) => {
  await requireAdmin();

  const [users, jobs, posts] = await Promise.all([
    prisma.user.count(),
    prisma.jobListing.count(),
    prisma.post.count(),
  ]);

  return NextResponse.json({ users, jobs, posts });
});
