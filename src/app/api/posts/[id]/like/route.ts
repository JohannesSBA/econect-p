import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (req: NextRequest, ctx?: Ctx) => {
  const rl = rateLimit(req, "posts:like", 60, 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();
  const { id: postId } = await ctx!.params;

  const existing = await prisma.like.findFirst({ where: { userId: user.id, postId } });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  const like = await prisma.like.create({ data: { userId: user.id, postId } });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "LIKE",
        title: "New like on your post",
        message: `${user.name} liked your post`,
        data: { postId, likerId: user.id, likeId: like.id },
      },
    });
  }

  return NextResponse.json({ liked: true });
});
