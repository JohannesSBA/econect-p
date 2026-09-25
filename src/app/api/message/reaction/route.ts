import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { messageReactionSchema } from "@/lib/validation/posts";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { messageId, emoji } = messageReactionSchema.parse(await req.json());

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [{ senderId: user.id }, { recipientId: user.id }],
    },
  });
  if (!message) throw new HttpError(404, "Message not found or access denied");

  const existing = await prisma.messageReaction.findFirst({
    where: { messageId, userId: user.id, emoji },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", reaction: existing });
  }

  const reaction = await prisma.messageReaction.create({
    data: { messageId, userId: user.id, emoji },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    action: "added",
    reaction: {
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    },
  });
});
