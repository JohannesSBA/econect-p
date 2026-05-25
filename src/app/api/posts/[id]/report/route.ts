import { NextRequest, NextResponse } from "next/server";

import { withHandler, type RouteContext } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { reportPostSchema } from "@/lib/validation/posts";

export const POST = withHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const rl = rateLimit(req, "posts:report", 10, 60 * 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();
  const { id: postId } = await ctx!.params;
  const { reason } = reportPostSchema.parse(await req.json());

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new HttpError(404, "Post not found");

  try {
    await (prisma as any).postReport.create({
      data: { postId, reporterId: user.id, reason: reason.trim() },
    });
  } catch {
    // unique violation — already reported
  }

  return NextResponse.json({ ok: true });
});
