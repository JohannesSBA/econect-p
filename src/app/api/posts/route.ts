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
    const limit = parseInt(searchParams.get("limit") || "8")

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

    // Exclude blocked users (both directions)
    let blockedUserIds: string[] = []
    try {
      const blocks = await (prisma as any).userBlock.findMany({
        where: {
          OR: [
            { blockerId: user.id },
            { blockedId: user.id }
          ]
        },
        select: { blockerId: true, blockedId: true }
      })
      blockedUserIds = blocks.map((b: any) => (b.blockerId === user.id ? b.blockedId : b.blockerId))
    } catch {}

    // Include followed companies
    let followedCompanyIds: string[] = []
    try {
      const follows = await (prisma as any).companyFollow.findMany({
        where: { followerId: user.id },
        select: { companyId: true }
      })
      followedCompanyIds = follows.map((f: any) => f.companyId)
    } catch {}

    // Build allowed author IDs (connections + self + followed companies) minus blocked users
    const authorIdsSet = new Set<string>([...connectedUserIds, ...followedCompanyIds])
    for (const b of blockedUserIds) authorIdsSet.delete(b)
    const authorIds = Array.from(authorIdsSet)

    // Get posts from allowed authors
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: authorIds }
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

    // If no personalized posts, provide trending posts within last 48 hours
    if (!posts || posts.length === 0) {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 48)

      // Exclude blocked authors from trending as well
      const blockedSet = new Set(blockedUserIds)

      const candidates = await prisma.post.findMany({
        where: {
          createdAt: { gte: since },
          authorId: blockedUserIds.length ? { notIn: Array.from(blockedSet) } : undefined,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, headline: true }
          },
          likes: {
            where: { createdAt: { gte: since } },
            select: { id: true }
          },
          comments: {
            where: { createdAt: { gte: since } },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' }
          },
          bookmarks: {
            where: { userId: user.id },
            select: { id: true }
          },
          _count: { select: { likes: true, comments: true } }
        },
        take: 50
      })

      // Sort by interaction score (likes + comments in window), break ties by recency
      const trendingSorted = candidates
        .sort((a: any, b: any) => {
          const sa = (a.likes?.length || 0) + (a.comments?.length || 0)
          const sb = (b.likes?.length || 0) + (b.comments?.length || 0)
          if (sb !== sa) return sb - sa
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        .slice(0, limit)

      return NextResponse.json({ posts: [], nextCursor: null, trending: trendingSorted })
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
