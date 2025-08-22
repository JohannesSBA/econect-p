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
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get("limit") || "10")

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
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {} as any)
    })

    let nextCursor: string | null = null
    if (posts.length > limit) {
      const next = posts.pop()!
      nextCursor = next.id
    }

    // TODO: inject approved ads at cadence in follow-up
    return NextResponse.json({ posts, nextCursor })
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

    const { title, content, type = "TEXT", images = [], linkUrl } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }
    if (title && title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 })
    }
    if (!Array.isArray(images)) {
      return NextResponse.json({ error: "Images must be an array" }, { status: 400 })
    }
    if (images.length > 3) {
      return NextResponse.json({ error: "You can upload up to 3 images" }, { status: 400 })
    }
    const sanitizedImages = images
      .filter((u: unknown) => typeof u === 'string' && (u as string).startsWith('http'))
      .slice(0, 3)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await prisma.post.create({
      data: {
        title: title?.trim() || null,
        content: content.trim(),
        type,
        imageUrl: sanitizedImages[0] || null,
        linkUrl,
        images: sanitizedImages,
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
