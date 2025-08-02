import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// GET /api/posts - Get posts for user's feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Get user's connections
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        sentConnections: {
          where: { status: "ACCEPTED" },
          include: { receiver: true }
        },
        receivedConnections: {
          where: { status: "ACCEPTED" },
          include: { sender: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get connected user IDs
    const connectedUserIds = [
      ...user.sentConnections.map(c => c.receiverId),
      ...user.receivedConnections.map(c => c.senderId),
      user.id // Include user's own posts
    ]

    // Get posts from connections and user
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: connectedUserIds }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, type = "TEXT", imageUrl, linkUrl } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        type,
        imageUrl,
        linkUrl,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
