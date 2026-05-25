import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { profileImageSchema } from "@/lib/validation/users";

export const PUT = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const parsed = profileImageSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Invalid imageUrl");

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { image: parsed.data.imageUrl || null },
    select: { id: true, name: true, email: true, image: true, headline: true, role: true },
  });

  return NextResponse.json({
    message: "Profile image updated successfully",
    user: updatedUser,
  });
});
