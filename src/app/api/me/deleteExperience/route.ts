import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const DELETE = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "ID is required");

  const experience = await prisma.experience.findUnique({
    where: { id },
    include: { jobSeekerProfile: { select: { userId: true } } },
  });

  if (!experience) throw new HttpError(404, "Experience not found");
  if (experience.jobSeekerProfile?.userId !== user.id) throw new HttpError(403, "Forbidden");

  await prisma.experience.delete({ where: { id } });

  return NextResponse.json({ message: "Experience deleted" });
});
