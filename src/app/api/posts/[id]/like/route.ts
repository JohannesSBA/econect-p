import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// POST /api/posts/[id]/like - Like/unlike a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: postId } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: user.id,
        postId: postId
      }
    })

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like the post
      const like = await prisma.like.create({
        data: {
          userId: user.id,
          postId: postId
        }
      })
      // Notify post author
      const post = await prisma.post.findUnique({ where: { id: postId } })
      if (post && post.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'LIKE',
            title: 'New like on your post',
            message: `${user.name} liked your post`,
            data: { postId, likerId: user.id, likeId: like.id },
          }
        })
      }
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
