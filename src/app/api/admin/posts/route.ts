import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!me || me.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit") ?? 20)),
  );

  const reportedPosts = await prisma.post.findMany({
    where: {
      reports: { some: {} },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      author: { select: { id: true, name: true, email: true } },
      reports: true,
    },
  });

  const recentComments = await prisma.comment.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      post: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({
    reportedPosts,
    recentComments,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const body = await req.json();
  const { resourceType, resourceId, action, reason } = body as {
    resourceType?: "post" | "comment";
    resourceId?: string;
    action?: "hide" | "restore";
    reason?: string;
  };

  if (!resourceType || !resourceId || !action) {
    return NextResponse.json(
      { error: "resourceType, resourceId and action required" },
      { status: 400 },
    );
  }

  if (resourceType === "post") {
    const updated = await prisma.post.update({
      where: { id: resourceId },
      data: {
        isVisible: action === "restore",
        moderationReason: action === "restore" ? null : reason,
      },
      select: {
        id: true,
        isVisible: true,
        moderationReason: true,
      },
    });
    return NextResponse.json({ success: true, post: updated });
  }

  const updated = await prisma.comment.update({
    where: { id: resourceId },
    data: {
      isVisible: action === "restore",
      moderationReason: action === "restore" ? null : reason,
    },
    select: {
      id: true,
      isVisible: true,
      moderationReason: true,
    },
  });
  return NextResponse.json({ success: true, comment: updated });
}

