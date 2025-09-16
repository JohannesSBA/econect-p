import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// GET /api/user/search?q=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  
  if (!q.trim()) {
    return NextResponse.json({ users: [] });
  }

  try {
    // Optional session to exclude blocked users when available
    let currentUserId: string | null = null
    try {
      const session = (await getServerSession(authOptions as any)) as Session | null
      const email = session?.user?.email
      const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null
      currentUserId = user?.id || null
    } catch {}

    let blockedUserIds: string[] = []
    if (currentUserId) {
      try {
        const blocks = await (prisma as any).userBlock.findMany({
          where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
          select: { blockerId: true, blockedId: true }
        })
        blockedUserIds = blocks.map((b: any) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
      } catch {}
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { headline: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
        ...(currentUserId ? { id: { not: currentUserId } } : {} as any),
        ...(blockedUserIds.length ? { id: { notIn: blockedUserIds } } : {} as any),
      },
      select: {
        id: true,
        name: true,
        image: true,
        headline: true,
        location: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
} 
