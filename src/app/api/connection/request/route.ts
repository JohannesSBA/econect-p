import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { connectionUserSchema } from "@/lib/validation/connections";

export const POST = withHandler(async (req: NextRequest) => {
  const rl = rateLimit(req, "connection:request", 20, 60 * 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();
  const { userId } = connectionUserSchema.parse(await req.json());

  if (user.id === userId) throw new HttpError(400, "Cannot connect to yourself");

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });
  if (existing) throw new HttpError(400, "Already requested or connected");

  const conn = await prisma.connection.create({
    data: { senderId: user.id, receiverId: userId, status: "PENDING" },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "CONNECTION_REQUEST",
      title: "New connection request",
      message: `${user.name} sent you a connection request`,
      data: { senderId: user.id },
    },
  });

  return NextResponse.json(conn, { status: 201 });
});
