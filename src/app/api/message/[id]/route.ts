import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// PUT /api/message/[id] - Edit message
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { text } = await req.json();
  const { id: messageId } = await params;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  try {
    // Check if user owns this message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: user.id
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId
      },
      data: {
        text: text.trim(),
        isEdited: true,
        editedAt: new Date()
      }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

// DELETE /api/message/[id] - Delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id: messageId } = await params;

  try {
    // Check if user owns this message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: user.id
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    // Delete message (this will cascade delete reactions and attachments)
    await prisma.message.delete({
      where: {
        id: messageId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
} 