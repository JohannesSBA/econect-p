import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateAboutSchema } from "@/lib/validation/users";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const { about } = updateAboutSchema.parse(await req.json());

  await prisma.user.update({
    where: { id: user.id },
    data: { profile: { update: { bio: about } } },
  });

  return NextResponse.json({ message: "Profile updated" });
});
