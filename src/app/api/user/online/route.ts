import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { onlineStatusSchema } from "@/lib/validation/users";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { isOnline } = onlineStatusSchema.parse(await req.json());
  const now = new Date();

  await prisma.userOnlineStatus.upsert({
    where: { userId: user.id },
    create: { userId: user.id, isOnline, lastSeen: now },
    update: { isOnline, lastSeen: now },
  });

  return NextResponse.json({ ok: true });
});

export const GET = withHandler(async (_req: NextRequest) => {
  const user = await requireUser();
  const status = await prisma.userOnlineStatus.findUnique({ where: { userId: user.id } });
  return NextResponse.json(status || { isOnline: false });
});
