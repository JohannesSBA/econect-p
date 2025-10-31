import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const chatId = searchParams.get('chatId');

  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }

  try {
    const whereClause: Prisma.MessageWhereInput = {
      OR: [
        { senderId: user.id },
        { recipientId: user.id }
      ],
      text: {
        contains: query,
        mode: 'insensitive'
      }
    };

    // If chatId is provided, search only in that chat
    if (chatId) {
      const [id1, id2] = chatId.split('--');
      whereClause.OR = [
        { AND: [{ senderId: user.id }, { recipientId: id1 === user.id ? id2 : id1 }] },
        { AND: [{ senderId: id1 === user.id ? id2 : id1 }, { recipientId: user.id }] }
      ];
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const results = messages.map(message => {
      const chatPartner = message.senderId === user.id ? message.recipient : message.sender;
      const chatPartnerId = chatPartner.id;
      const chatId = [user.id, chatPartnerId].sort().join('--');
      
      // Highlight the search term in the text
      const highlightedText = message.text.replace(
        new RegExp(query, 'gi'),
        match => `<mark>${match}</mark>`
      );

      return {
        message: {
          id: message.id,
          text: message.text,
          createdAt: message.createdAt,
          senderId: message.senderId,
        },
        chatId,
        chatPartnerName: chatPartner.name,
        highlightedText
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching messages:", error);
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 });
  }
} 
