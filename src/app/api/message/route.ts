import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// GET /api/message/thread?userId=...
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: userId },
        { senderId: userId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

// POST /api/message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  const { text, chatId, chatPartner, attachments, replyTo } = await req.json();
  
  if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
    return NextResponse.json({ error: "Message text or attachments are required" }, { status: 400 });
  }

  if (!chatId || !chatPartner) {
    return NextResponse.json({ error: "chatId and chatPartner are required" }, { status: 400 });
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
    return NextResponse.json({ error: "Users must be connected to send messages" }, { status: 403 });
  }

  try {
    // Create message
    const messageData: {
      senderId: string;
      recipientId: string;
      text: string;
      replyTo?: string;
    } = {
      senderId: user.id,
      recipientId: chatPartner,
      text: text?.trim() || "",
    };

    // Add replyTo if provided
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        attachments: true,
        reactions: true,
      }
    });

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            uploadedById: user.id,
            type: attachment.type,
            url: attachment.url,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            thumbnail: attachment.thumbnail,
            duration: attachment.duration,
          }
        });
      }
    }

    // Fetch the complete message with attachments
    const completeMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        attachments: true,
        reactions: true,
      }
    });

    return NextResponse.json({
      id: completeMessage!.id,
      senderId: completeMessage!.senderId,
      recipientId: completeMessage!.recipientId,
      text: completeMessage!.text,
      createdAt: completeMessage!.createdAt,
      readBy: [],
      attachments: completeMessage!.attachments,
      reactions: completeMessage!.reactions,
      replyTo: completeMessage!.replyTo,
      isEdited: completeMessage!.isEdited,
      editedAt: completeMessage!.editedAt,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
