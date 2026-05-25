import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { createPostSchema } from "@/lib/validation/posts";

export const GET = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "8")));

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      sentConnections: { where: { status: "ACCEPTED" }, select: { receiverId: true } },
      receivedConnections: { where: { status: "ACCEPTED" }, select: { senderId: true } },
    },
  });

  if (!dbUser) throw new HttpError(404, "User not found");

  const connectedUserIds = [
    ...dbUser.sentConnections.map((c) => c.receiverId),
    ...dbUser.receivedConnections.map((c) => c.senderId),
    user.id,
  ];

  let blockedUserIds: string[] = [];
  try {
    const blocks = await (prisma as any).userBlock.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
      select: { blockerId: true, blockedId: true },
    });
    blockedUserIds = blocks.map((b: any) =>
      b.blockerId === user.id ? b.blockedId : b.blockerId,
    );
  } catch {}

  let followedCompanyIds: string[] = [];
  try {
    const follows = await (prisma as any).companyFollow.findMany({
      where: { followerId: user.id },
      select: { companyId: true },
    });
    followedCompanyIds = follows.map((f: any) => f.companyId);
  } catch {}

  const authorIdsSet = new Set<string>([...connectedUserIds, ...followedCompanyIds]);
  for (const b of blockedUserIds) authorIdsSet.delete(b);
  const authorIds = Array.from(authorIdsSet);

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    include: {
      author: { select: { id: true, name: true, image: true, headline: true } },
      likes: { include: { user: { select: { id: true, name: true } } } },
      comments: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : ({} as any)),
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    nextCursor = posts.pop()!.id;
  }

  if (!posts.length) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const blockedSet = new Set(blockedUserIds);

    const candidates = await prisma.post.findMany({
      where: {
        createdAt: { gte: since },
        authorId: blockedUserIds.length ? { notIn: Array.from(blockedSet) } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, image: true, headline: true } },
        likes: { where: { createdAt: { gte: since } }, select: { id: true } },
        comments: {
          where: { createdAt: { gte: since } },
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        bookmarks: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      take: 50,
    });

    const trending = candidates
      .sort((a: any, b: any) => {
        const sa = (a.likes?.length || 0) + (a.comments?.length || 0);
        const sb = (b.likes?.length || 0) + (b.comments?.length || 0);
        if (sb !== sa) return sb - sa;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    return NextResponse.json({ posts: [], nextCursor: null, trending });
  }

  return NextResponse.json({ posts, nextCursor });
});

export const POST = withHandler(async (req: NextRequest) => {
  const rl = rateLimit(req, "posts:create", 10, 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();
  const parsed = createPostSchema.parse(await req.json());

  const sanitizedImages = (parsed.images ?? []).filter(
    (u) => typeof u === "string" && u.startsWith("http"),
  );

  const post = await prisma.post.create({
    data: {
      title: parsed.title?.trim() || null,
      content: parsed.content.trim(),
      type: parsed.type ?? "TEXT",
      imageUrl: sanitizedImages[0] || null,
      linkUrl: parsed.linkUrl ?? null,
      images: sanitizedImages,
      authorId: user.id,
    },
    include: {
      author: { select: { id: true, name: true, image: true, headline: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
});
