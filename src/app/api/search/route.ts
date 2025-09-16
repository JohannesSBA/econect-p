import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all'; // 'all', 'people', 'jobs', 'posts'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ 
      people: [], 
      jobs: [], 
      posts: [],
      totalResults: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }

  try {
    // Build blocked user set (both directions)
    let blockedUserIds: string[] = []
    try {
      const blocks = await (prisma as any).userBlock.findMany({
        where: {
          OR: [
            { blockerId: user.id },
            { blockedId: user.id },
          ]
        },
        select: { blockerId: true, blockedId: true }
      })
      blockedUserIds = blocks.map((b: any) => (b.blockerId === user.id ? b.blockedId : b.blockerId))
    } catch {}
    const searchQuery = query.trim();
    const results: {
      people: any[];
      jobs: any[];
      posts: any[];
      totalResults: number;
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    } = {
      people: [],
      jobs: [],
      posts: [],
      totalResults: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };

    // Search for people
    if (type === 'all' || type === 'people') {
      const [people, totalPeople] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } },
              { headline: { contains: searchQuery, mode: 'insensitive' } },
              { location: { contains: searchQuery, mode: 'insensitive' } },
            ],
            AND: [
              { id: { not: user.id } },
              ...(blockedUserIds.length ? [{ id: { notIn: blockedUserIds } }] : []),
            ]
          },
          select: {
            id: true,
            name: true,
            email: true,
            headline: true,
            location: true,
            image: true,
            role: true,
            createdAt: true,
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } },
              { headline: { contains: searchQuery, mode: 'insensitive' } },
              { location: { contains: searchQuery, mode: 'insensitive' } },
            ],
            AND: [
              { id: { not: user.id } },
              ...(blockedUserIds.length ? [{ id: { notIn: blockedUserIds } }] : []),
            ]
          }
        })
      ]);

      results.people = people;
      results.totalResults += totalPeople;
    }

    // Search for jobs
    if (type === 'all' || type === 'jobs') {
      const [jobs, totalJobs] = await Promise.all([
        prisma.jobListing.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
              { company: { contains: searchQuery, mode: 'insensitive' } },
              { location: { contains: searchQuery, mode: 'insensitive' } },
              { tags: { hasSome: [searchQuery] } },
            ],
            status: 'OPEN'
          },
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            applications: {
              where: { userId: user.id },
              select: { id: true }
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.jobListing.count({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
              { company: { contains: searchQuery, mode: 'insensitive' } },
              { location: { contains: searchQuery, mode: 'insensitive' } },
              { tags: { hasSome: [searchQuery] } },
            ],
            status: 'OPEN'
          }
        })
      ]);

      results.jobs = jobs.map(job => ({
        ...job,
        hasApplied: job.applications.length > 0,
        applicationCount: job.applications.length
      }));
      results.totalResults += totalJobs;
    }

    // Search for posts
    if (type === 'all' || type === 'posts') {
      const [posts, totalPosts] = await Promise.all([
        prisma.post.findMany({
          where: {
            content: { contains: searchQuery, mode: 'insensitive' },
            ...(blockedUserIds.length ? { authorId: { notIn: blockedUserIds } } : {} as any)
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                headline: true,
              }
            },
            likes: {
              where: { userId: user.id },
              select: { id: true }
            },
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.post.count({
          where: {
            content: { contains: searchQuery, mode: 'insensitive' },
            ...(blockedUserIds.length ? { authorId: { notIn: blockedUserIds } } : {} as any)
          }
        })
      ]);

      results.posts = posts.map(post => ({
        ...post,
        isLiked: post.likes.length > 0,
        likeCount: post.likes.length,
        commentCount: post.comments.length
      }));
      results.totalResults += totalPosts;
    }

    // Calculate pagination
    const totalPages = Math.ceil(results.totalResults / limit);
    results.pagination = {
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
} 
