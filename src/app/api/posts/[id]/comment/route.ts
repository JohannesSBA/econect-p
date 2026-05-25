import { NextRequest, NextResponse } from "next/server";

import { withHandler, type RouteContext } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { createCommentSchema } from "@/lib/validation/posts";

export const POST = withHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const rl = rateLimit(req, "posts:comment", 30, 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();
  const { id: postId } = await ctx!.params;
  const { content } = createCommentSchema.parse(await req.json());

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, "Post not found");

  const comment = await prisma.comment.create({
    data: { content: content.trim(), userId: user.id, postId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  if (post.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        title: "New comment on your post",
        message: `${user.name} commented on your post`,
        data: { postId, commenterId: user.id, commentId: comment.id },
      },
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
});
