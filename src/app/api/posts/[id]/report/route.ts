import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/posts/[id]/report - Report a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reason } = await request.json()
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json({ error: "Reason must be at least 3 characters" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id: postId } = await params

    // Ensure post exists
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Create or ignore if already reported by this user
    try {
      await (prisma as any).postReport.create({
        data: {
          postId,
          reporterId: user.id,
          reason: reason.trim(),
        },
      })
    } catch (_error: unknown) {
      // Unique violation -> already reported
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error reporting post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
