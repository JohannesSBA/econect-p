import { getCurrentUser } from "@/lib/getCurrentUser"
import prisma from "@/lib/prisma"
import ProfilePageClient from "./ProfilePageClient"

export default async function ProfilePage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not authenticated</h1>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  // Fetch user with profile data
  const userWithProfile = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      headline: true,
      role: true,
      createdAt: true,
      profile: {
        include: {
          experiences: true,
          education: true,
          skills: { include: { skill: true } },
        }
      }
    }
  })

  if (!userWithProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600 mb-4">Please log in with a valid account.</p>
        </div>
      </div>
    )
  }

  // Fetch user's posts
  const posts = await prisma.post.findMany({
    where: { authorId: currentUser.id },
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
        select: { likes: true, comments: true }
      },
      likes: {
        where: { userId: currentUser.id },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch saved posts/jobs (optional if bookmark tables exist)
  const db: any = prisma as any
  let savedPosts: any[] = []
  let savedJobs: any[] = []
  try {
    savedPosts = await db.postBookmark.findMany({
      where: { userId: currentUser.id },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true, image: true, headline: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch {}
  try {
    savedJobs = await db.jobBookmark.findMany({
      where: { userId: currentUser.id },
      include: {
        job: true,
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch {}

  // Suggestions: People also viewed (users not connected to the current user)
  const peopleAlsoViewed = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUser.id } },
        {
          OR: [
            {
              sentConnections: {
                none: {
                  OR: [
                    { receiverId: currentUser.id },
                    { senderId: currentUser.id }
                  ]
                }
              }
            },
            {
              receivedConnections: {
                none: {
                  OR: [
                    { receiverId: currentUser.id },
                    { senderId: currentUser.id }
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      location: true
    },
    take: 6,
    orderBy: { createdAt: 'desc' }
  })

  // Suggestions: Similar profiles (overlap by skills or education)
  const userSkillIds = (userWithProfile.profile?.skills || []).map((s: any) => s.skillId).filter(Boolean)
  const userSchools = (userWithProfile.profile?.education || []).map((e: any) => e.school).filter(Boolean)

  const similarProfiles = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUser.id } },
        {
          OR: [
            userSkillIds.length > 0
              ? {
                  profile: {
                    skills: {
                      some: {
                        skillId: { in: userSkillIds }
                      }
                    }
                  }
                }
              : undefined,
            userSchools.length > 0
              ? {
                  profile: {
                    education: {
                      some: {
                        school: { in: userSchools }
                      }
                    }
                  }
                }
              : undefined
          ].filter(Boolean) as any
        }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      location: true
    },
    take: 6
  })

  // Real connection count for current user
  const connectionCount = await prisma.connection.count({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: currentUser.id },
        { receiverId: currentUser.id }
      ]
    }
  })

  return <ProfilePageClient lang={lang} userWithProfile={userWithProfile} posts={posts as any} peopleAlsoViewed={peopleAlsoViewed as any} similarProfiles={similarProfiles as any} connectionCount={connectionCount} savedPosts={savedPosts as any} savedJobs={savedJobs as any} />
}
