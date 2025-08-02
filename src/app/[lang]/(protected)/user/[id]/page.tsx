import { Button } from "@/components/ui/button"
import Header from "../../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
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

  // Don't show own profile here - redirect to own profile page
  if (currentUser.id === user.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">This is your own profile</h1>
          <p className="text-gray-600 mb-4">You're viewing your own profile. Use the edit functionality on your profile page.</p>
          <Link href={`/${lang}/profile`}>
            <Button>Go to My Profile</Button>
          </Link>
        </div>
      </div>
    )
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
      />
    </div>
  )
} 