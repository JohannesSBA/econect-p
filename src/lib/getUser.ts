import prisma from "./prisma"

export default async function getUser(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
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
    return user
}