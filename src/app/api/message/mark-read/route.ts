import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/message/mark-read
// Body: { chatPartner: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { chatPartner } = await req.json();
  if (!chatPartner) {
    return NextResponse.json({ error: "chatPartner is required" }, { status: 400 });
  }

  try {
    // Find unread messages in this conversation where current user is recipient
    const unread = await prisma.message.findMany({
      where: {
        recipientId: user.id,
        senderId: chatPartner,
        NOT: {
          readBy: {
            some: { id: user.id },
          },
        },
      },
      select: { id: true },
    });

    if (unread.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Mark each as read by connecting user to readBy relation and setting readAt
    await Promise.all(
      unread.map((m) =>
        prisma.message.update({
          where: { id: m.id },
          data: {
            readAt: new Date(),
            readBy: {
              connect: { id: user.id },
            },
          },
        })
      )
    );

    return NextResponse.json({ updated: unread.length });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}


