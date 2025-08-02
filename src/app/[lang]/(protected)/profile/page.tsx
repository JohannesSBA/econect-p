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

  return <ProfilePageClient lang={lang} userWithProfile={userWithProfile} />
}
