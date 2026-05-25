import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { connectionUserSchema } from "@/lib/validation/connections";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { userId } = connectionUserSchema.parse(await req.json());

  if (user.id === userId) throw new HttpError(400, "Cannot block yourself");

  try {
    await (prisma as any).userBlock.create({
      data: { blockerId: user.id, blockedId: userId },
    });
  } catch {
    // unique constraint — already blocked
  }

  await prisma.connection.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });

  return NextResponse.json({ ok: true });
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { userId } = connectionUserSchema.parse(await req.json().catch(() => ({})));

  await (prisma as any).userBlock.deleteMany({
    where: { blockerId: user.id, blockedId: userId },
  });

  return NextResponse.json({ ok: true });
});
