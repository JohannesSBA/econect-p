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

  const { messageId, emoji } = await req.json();

  if (!messageId || !emoji) {
    return NextResponse.json({ error: "messageId and emoji are required" }, { status: 400 });
  }

  try {
    // Check if user has access to this message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: user.id },
          { recipientId: user.id }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: user.id,
        emoji
      }
    });

    if (existingReaction) {
      // Remove existing reaction
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id
        }
      });

      return NextResponse.json({ 
        action: 'removed',
        reaction: existingReaction 
      });
    } else {
      // Add new reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      return NextResponse.json({ 
        action: 'added',
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          userId: reaction.userId,
          userName: reaction.user.name,
          createdAt: reaction.createdAt
        }
      });
    }
  } catch (error) {
    console.error("Error handling message reaction:", error);
    return NextResponse.json({ error: "Failed to handle reaction" }, { status: 500 });
  }
} 