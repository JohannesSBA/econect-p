import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { Session } from "next-auth";

export async function POST(request: Request) {
  const body = await request.json()
  const session = await getServerSession(authOptions) as Session
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Include the profile's own `id`
  const userWithProfile = await prisma.user.findUnique({
    where: { id: session.user?.id as string },
    include: {
      profile: {
        select: { id: true }
      }
    }
  })

  if (!userWithProfile?.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }


  const education = await prisma.education.create({
    data: {
      ...body,
      jobSeekerProfile: {
        // <<< CONNECT TO THE PROFILE.ID, NOT THE USER.ID
        connect: { id: userWithProfile.profile.id }
      }
    }
  })

  return NextResponse.json({ message: 'Education added', education })
}
