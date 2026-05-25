import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { banUserSchema } from "@/lib/validation/users";

export const POST = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const parsed = banUserSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "userId is required");

  const target = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { isSuspended: true, suspendedAt: new Date() },
    select: { id: true, email: true, name: true, isSuspended: true, suspendedAt: true },
  });

  return NextResponse.json({ success: true, user: target });
});
