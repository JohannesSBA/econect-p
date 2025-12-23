import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { performance } from "perf_hooks";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

async function traceQuery<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[DB] ${label} ${(performance.now() - start).toFixed(1)}ms`);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await traceQuery("message:getUserByEmail", () =>
    prisma.user.findUnique({ where: { email: session.user.email } }),
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { chatPartner, chatId } = body;
  const limit = Math.max(1, Math.min(50, Number(body.limit) || 15));
  const beforeStr = body.before as string | undefined;

  if (!chatPartner || !chatId) {
    return NextResponse.json({ error: "chatPartner and chatId are required" }, { status: 400 });
  }

  // Verify that the users are connected
  const connection = await traceQuery("message:getConnection", () =>
    prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: chatPartner, status: 'ACCEPTED' },
          { senderId: chatPartner, receiverId: user.id, status: 'ACCEPTED' }
        ]
      }
    }),
  );

  if (!connection) {
    return NextResponse.json({ error: "Users must be connected to view messages" }, { status: 403 });
  }

  try {
    // Build base where for conversation
    const whereBase = {
      OR: [
        { recipientId: chatPartner, senderId: user.id },
        { recipientId: user.id, senderId: chatPartner },
      ],
    } as const

    // Apply 'before' filter if provided (fetch older messages)
    const where = beforeStr
      ? { AND: [whereBase as any, { createdAt: { lt: new Date(beforeStr) } }] }
      : (whereBase as any)

    // Fetch one extra to compute hasMore
    const results = await traceQuery("message:fetchThread", () =>
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
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
            select: { id: true, name: true, email: true },
          },
          recipient: {
            select: { id: true, name: true, email: true },
          },
          readAt: true,
          readBy: true,
          attachments: {
            select: {
              id: true, type: true, url: true, filename: true, size: true, mimeType: true, thumbnail: true, duration: true,
            },
          },
          reactions: {
            select: {
              id: true, emoji: true, userId: true, createdAt: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      }),
    )

    const hasMore = results.length > limit
    const slice = hasMore ? results.slice(0, limit) : results
    const asc = slice.reverse()

    return NextResponse.json({ messages: asc, hasMore })
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
