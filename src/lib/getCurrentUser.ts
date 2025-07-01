// lib/getCurrentUser.ts

import { getServerSession } from "next-auth/next"
import { authOptions }       from "@/app/api/auth/[...nextauth]/options"
import prisma                from "@/lib/prisma"

/**
 * Fetches the current logged-in user from the database, or returns null.
 */
export async function getCurrentUser() {
  // 1) Read session (verifies JWT)
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  console.log("session", session)
  
  // Use email as identifier since ID isn't present in session type
  const userEmail = session.user.email
  
  if (!userEmail || typeof userEmail !== 'string') {
    console.error("Invalid user email in session")
    return null
  }

  console.log("userEmail", userEmail)

  // 2) Fetch full user record using email
  try {
    const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id:           true,
      name:         true,
      email:        true,
      phone:        true,
      role:         true,
      createdAt:    true,
      applications: true,
      friendOf:     true,
      jobListings:  true,
      messagesRead: true,
      language:     true,
      friends:      true,
      messagesReceived: true,
      messagesSent: true,
      password:     false,
      pendingFriendRequest: true,
      profile:      {
        select: {
          id: true,
          bio: true,
          education: true,
          skills: true,
          resumeUrl: true,
          experiences: true,
        },
      },
      sentFriendRequest: true,
      sessions:     false,
      },
    })

    if (!user) {
      console.error("No user found with email:", userEmail)
      return null
    }

    console.log("user", user)
    return user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }

}
