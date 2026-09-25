import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { promoteUserSchema } from "@/lib/validation/users";

export const POST = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const parsed = promoteUserSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "Invalid request");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ success: true });
});
