import { Button } from "@/components/ui/button"
import Header from "../../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import UserProfileClient from "./UserProfileClient"

interface UserProfilePageProps {
  params: Promise<{ lang: 'en' | 'am', id: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { lang, id } = await params
  const currentUser = await getCurrentUser() as unknown as User

  // Fetch the user whose profile we're viewing
  const user = await prisma.user.findUnique({
    where: { 
      id,
      role: { not: "ADMIN" } // Exclude admin accounts
    },
    include: {
      profile: {
        include: {
          experiences: true,
          education: true,
          skills: {
            include: {
              skill: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Block visibility if either direction is blocked
  const blocked = await (prisma as any).userBlock.findFirst({
    where: {
      OR: [
        { blockerId: currentUser.id, blockedId: id },
        { blockerId: id, blockedId: currentUser.id },
      ]
    },
    select: { id: true }
  })
  if (blocked) {
    notFound()
  }

  // Don't show own profile here - redirect to own profile page
  if (currentUser.id === user.id) {
    redirect(`/${lang}/profile`)
  }

  // Check connection status
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: user.id },
        { senderId: user.id, receiverId: currentUser.id },
      ],
    },
  })

  const isConnected = connection?.status === 'ACCEPTED'
  const hasPendingRequest = connection?.status === 'PENDING'
  const isRequestSentByMe = hasPendingRequest && connection.senderId === currentUser.id

  // Real connection count for viewed user
  const connectionCount = await prisma.connection.count({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: user.id },
        { receiverId: user.id }
      ]
    }
  })

  // Suggestions relative to the viewed user
  const peopleAlsoViewed = await prisma.user.findMany({
    where: {
      id: { notIn: [currentUser.id, user.id] },
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

  const targetSkillIds = (user.profile?.skills || []).map((s: any) => s.skillId).filter(Boolean)
  const targetSchools = (user.profile?.education || []).map((e: any) => e.school).filter(Boolean)

  const similarProfiles = await prisma.user.findMany({
    where: {
      AND: [
        { id: { notIn: [currentUser.id, user.id] } },
        {
          OR: [
            targetSkillIds.length > 0
              ? { profile: { skills: { some: { skillId: { in: targetSkillIds } } } } }
              : undefined,
            targetSchools.length > 0
              ? { profile: { education: { some: { school: { in: targetSchools } } } } }
              : undefined,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={currentUser} />
      
      <UserProfileClient
        lang={lang}
        currentUser={currentUser}
        user={user}
        connection={connection}
        isConnected={isConnected}
        hasPendingRequest={hasPendingRequest}
        isRequestSentByMe={isRequestSentByMe}
        connectionCount={connectionCount}
        peopleAlsoViewed={peopleAlsoViewed as any}
        similarProfiles={similarProfiles as any}
      />
    </div>
  )
} 
