import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// GET /api/connections - Get user's connections
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        sentConnections: {
          where: { status: "ACCEPTED" },
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                image: true,
                headline: true,
                location: true
              }
            }
          }
        },
        receivedConnections: {
          where: { status: "ACCEPTED" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                headline: true,
                location: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Combine sent and received accepted connections
    const connections = [
      ...user.sentConnections.map((c) => c.receiver),
      ...user.receivedConnections.map((c) => c.sender)
    ]

    return NextResponse.json({ connections })
  } catch (error) {
    console.error("Error fetching connections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
