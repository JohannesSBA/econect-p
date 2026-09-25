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
    data: { status: "ACCEPTED" },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "CONNECTION_REQUEST",
      title: "Connection accepted",
      message: `${user.name} accepted your connection request`,
      data: { receiverId: user.id },
    },
  });

  return NextResponse.json(updated);
});
