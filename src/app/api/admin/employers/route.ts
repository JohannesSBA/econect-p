import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!me || me.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const employers = await prisma.employerProfile.findMany({
    where: { isVerified: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employers });
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const body = await req.json();
  const { employerProfileId, action } = body as {
    employerProfileId?: string;
    action?: "verify" | "suspend";
  };

  if (!employerProfileId || !action) {
    return NextResponse.json(
      { error: "employerProfileId and action required" },
      { status: 400 },
    );
  }

  switch (action) {
    case "verify": {
      const profile = await prisma.employerProfile.update({
        where: { id: employerProfileId },
        data: { isVerified: true },
        include: { user: { select: { id: true, name: true } } },
      });
      return NextResponse.json({ success: true, profile });
    }
    case "suspend": {
      const profile = await prisma.employerProfile.update({
        where: { id: employerProfileId },
        data: { isVerified: false },
        include: { user: { select: { id: true, name: true } } },
      });
      return NextResponse.json({ success: true, profile });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

