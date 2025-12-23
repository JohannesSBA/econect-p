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
    const duration = performance.now() - start;
    console.log(`[DB] ${label} ${duration.toFixed(1)}ms`);
  }
}

// GET /api/message/thread?userId=...
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const user = await traceQuery("message:getUserByEmail", () =>
    prisma.user.findUnique({ where: { email: session.user.email } }),
  );
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

  // Verify that the users are connected, unless exceptions apply
  const isEmployerRole = user.role === 'EMPLOYER' || user.role === 'RECRUITER' || user.role === 'ADMIN'
  const recipient = await traceQuery("message:getRecipient", () =>
    prisma.user.findUnique({ where: { id: chatPartner }, select: { id: true, role: true } }),
  )
  const isRecipientEmployer = recipient ? (recipient.role === 'EMPLOYER' || recipient.role === 'RECRUITER' || recipient.role === 'ADMIN') : false

  if (!isEmployerRole) {
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
      // Allow sending to employer/recruiter as a message request
      if (!isRecipientEmployer) {
        return NextResponse.json({ error: "Users must be connected to send messages" }, { status: 403 });
      }
    }
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

    const message = await traceQuery("message:createMessage", () =>
      prisma.message.create({
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
      }),
    );

    // If sender is not employer and recipient is employer and not connected, ensure a PENDING message request exists
    if (!isEmployerRole && isRecipientEmployer) {
      try {
        const repliedBefore = await traceQuery("message:checkRecipientReply", () =>
          prisma.message.findFirst({
            where: { senderId: chatPartner, recipientId: user.id },
            select: { id: true }
          }),
        )
        await traceQuery("message:upsertMessageRequest", () =>
          (prisma as any).messageRequest.upsert({
            where: { senderId_recipientId: { senderId: user.id, recipientId: chatPartner } },
            create: {
              senderId: user.id,
              recipientId: chatPartner,
              status: repliedBefore ? 'ACCEPTED' : 'PENDING'
            },
            update: {
              status: repliedBefore ? 'ACCEPTED' : 'PENDING'
            }
          }),
        )
      } catch {}
    }

    // If sender is employer, accept any existing pending message request from the recipient
    if (isEmployerRole) {
      try {
        await traceQuery("message:autoAcceptMessageRequests", () =>
          (prisma as any).messageRequest.updateMany({
            where: { senderId: chatPartner, recipientId: user.id, status: 'PENDING' },
            data: { status: 'ACCEPTED' }
          }),
        )
      } catch {}
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await traceQuery("message:createAttachment", () =>
          prisma.messageAttachment.create({
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
          }),
        );
      }
    }

    // Fetch the complete message with attachments
    const completeMessage = await traceQuery("message:getCompleteMessage", () =>
      prisma.message.findUnique({
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
      }),
    );

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
      sender: {
        id: completeMessage!.sender.id,
        name: completeMessage!.sender.name,
        image: completeMessage!.sender.image,
      },
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
