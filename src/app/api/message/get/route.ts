import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { chatPartner, chatId } = body;

  if (!chatPartner || !chatId) {
    return NextResponse.json({ error: "chatPartner and chatId are required" }, { status: 400 });
  }

  // Verify that the users are connected
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: chatPartner, status: 'ACCEPTED' },
        { senderId: chatPartner, receiverId: user.id, status: 'ACCEPTED' }
      ]
    }
  });

  if (!connection) {
    return NextResponse.json({ error: "Users must be connected to view messages" }, { status: 403 });
  }

  try {
    // Get messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            AND: [
              { recipientId: chatPartner }, 
              { senderId: user.id }
            ],
          },
          {
            AND: [
              { recipientId: user.id }, 
              { senderId: chatPartner }
            ],
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        recipientId: true,
        senderId: true,
        text: true,
        replyTo: true,
        isEdited: true,
        editedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        readAt: true,
        readBy: true,
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            size: true,
            mimeType: true,
            thumbnail: true,
            duration: true,
          }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}