import { NextRequest, NextResponse } from "next/server";

import { withHandler, type RouteContext } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const POST = withHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireUser();
  const { id: postId } = await ctx!.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, "Post not found");

  const db = prisma as any;
  const existing = await db.postBookmark.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });
  if (!existing) {
    await db.postBookmark.create({ data: { userId: user.id, postId } });
  }

  return NextResponse.json({ saved: true });
});

export const DELETE = withHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireUser();
  const { id: postId } = await ctx!.params;

  await (prisma as any).postBookmark.deleteMany({ where: { userId: user.id, postId } });

  return NextResponse.json({ saved: false });
});
