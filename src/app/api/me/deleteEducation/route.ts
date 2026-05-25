import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const DELETE = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "ID is required");

  const education = await prisma.education.findUnique({
    where: { id },
    include: { jobSeekerProfile: { select: { userId: true } } },
  });

  if (!education) throw new HttpError(404, "Education not found");
  if (education.jobSeekerProfile?.userId !== user.id) throw new HttpError(403, "Forbidden");

  await prisma.education.delete({ where: { id } });

  return NextResponse.json({ message: "Education deleted" });
});
