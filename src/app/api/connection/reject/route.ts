import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { connectionUserSchema } from "@/lib/validation/connections";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { userId } = connectionUserSchema.parse(await req.json());

  const conn = await prisma.connection.findFirst({
    where: { senderId: userId, receiverId: user.id, status: "PENDING" },
  });
  if (!conn) throw new HttpError(404, "No pending request");

  const updated = await prisma.connection.update({
    where: { id: conn.id },
    data: { status: "REJECTED" },
  });

  return NextResponse.json(updated);
});

export const GET = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) throw new HttpError(400, "userId is required");

  const conn = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });

  return NextResponse.json(conn || {});
});
