import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { experienceSchema } from "@/lib/validation/users";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const parsed = experienceSchema.parse(await req.json());

  const userWithProfile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: { select: { id: true } } },
  });

  if (!userWithProfile?.profile) throw new HttpError(404, "Profile not found");

  const experience = await prisma.experience.create({
    data: {
      jobTitle: parsed.jobTitle,
      company: parsed.company,
      location: parsed.location ?? null,
      employmentType: parsed.employmentType ?? null,
      startDate: parsed.startDate,
      endDate: parsed.endDate ?? null,
      current: parsed.current ?? false,
      description: parsed.description ?? null,
      jobSeekerProfile: { connect: { id: userWithProfile.profile.id } },
    },
  });

  return NextResponse.json({ message: "Experience added", experience }, { status: 201 });
});
