import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/user/block - Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (me.id === userId) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 })

    try {
      await (prisma as any).userBlock.create({
        data: {
          blockerId: me.id,
          blockedId: userId,
        }
      })
    } catch (_error: unknown) {
      // ignore unique constraint (already blocked)
    }

    // Remove any existing connection between users (both directions)
    try {
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { senderId: me.id, receiverId: userId },
            { senderId: userId, receiverId: me.id },
          ]
        }
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error blocking user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/user/block - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = body?.userId
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await (prisma as any).userBlock.deleteMany({
      where: { blockerId: me.id, blockedId: userId }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
