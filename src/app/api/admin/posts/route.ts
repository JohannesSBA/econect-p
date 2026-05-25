import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const [reportedPosts, recentComments] = await Promise.all([
    prisma.post.findMany({
      where: { reports: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        reports: true,
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
        post: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ reportedPosts, recentComments });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();
  const { resourceType, resourceId, action, reason } = body as {
    resourceType?: "post" | "comment";
    resourceId?: string;
    action?: "hide" | "restore";
    reason?: string;
  };

  if (!resourceType || !resourceId || !action) {
    throw new HttpError(400, "resourceType, resourceId and action required");
  }

  if (resourceType === "post") {
    const updated = await prisma.post.update({
      where: { id: resourceId },
      data: { isVisible: action === "restore", moderationReason: action === "restore" ? null : reason },
      select: { id: true, isVisible: true, moderationReason: true },
    });
    return NextResponse.json({ success: true, post: updated });
  }

  const updated = await prisma.comment.update({
    where: { id: resourceId },
    data: { isVisible: action === "restore", moderationReason: action === "restore" ? null : reason },
    select: { id: true, isVisible: true, moderationReason: true },
  });
  return NextResponse.json({ success: true, comment: updated });
});
