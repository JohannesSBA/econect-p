import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { editMessageSchema } from "@/lib/validation/posts";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withHandler(async (req: NextRequest, ctx?: Ctx) => {
  const user = await requireUser();
  const { id: messageId } = await ctx!.params;
  const { text } = editMessageSchema.parse(await req.json());

  const message = await prisma.message.findFirst({
    where: { id: messageId, senderId: user.id },
  });
  if (!message) throw new HttpError(404, "Message not found or access denied");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { text: text.trim(), isEdited: true, editedAt: new Date() },
  });

  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (_req: NextRequest, ctx?: Ctx) => {
  const user = await requireUser();
  const { id: messageId } = await ctx!.params;

  const message = await prisma.message.findFirst({
    where: { id: messageId, senderId: user.id },
  });
  if (!message) throw new HttpError(404, "Message not found or access denied");

  await prisma.message.delete({ where: { id: messageId } });

  return NextResponse.json({ success: true });
});
