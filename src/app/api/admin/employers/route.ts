import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

const DEFAULT_PAGE_SIZE = 10;

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true },
  });
  if (!me || me.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return me;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const search = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );

  const where: Prisma.EmployerProfileWhereInput = {};
  if (status === "pending") {
    where.isVerified = false;
  } else if (status === "verified") {
    where.isVerified = true;
  }
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [employers, total] = await Promise.all([
    prisma.employerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  return NextResponse.json({ employers, page, pageSize, total });
}

export async function PATCH(req: NextRequest) {
  const admin = await (async () => {
    try {
      return await ensureAdmin();
    } catch (response) {
      if (response instanceof NextResponse) return response;
      throw response;
    }
  })();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { employerProfileId, employerProfileIds, action } = body as {
      employerProfileId?: string;
      employerProfileIds?: string[];
      action?: "verify" | "suspend";
      reason?: string;
    };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const ids = Array.isArray(employerProfileIds)
      ? employerProfileIds.filter(Boolean)
      : employerProfileId
        ? [employerProfileId]
        : [];

    if (!ids.length || !action) {
      return NextResponse.json(
        { error: "employerProfileId(s) and action required" },
        { status: 400 },
      );
    }

    if (action === "suspend" && !reason) {
      return NextResponse.json(
        { error: "Suspension reason is required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updates = await prisma.$transaction(
      ids.map((id) => {
        switch (action) {
          case "verify":
            return prisma.employerProfile.update({
              where: { id },
              data: {
                isVerified: true,
                verifiedAt: now,
                verifiedById: admin.id,
                verificationNote: reason || null,
              },
              include: { user: { select: { id: true, name: true, email: true } } },
            });
          case "suspend":
            return prisma.employerProfile.update({
              where: { id },
              data: {
                isVerified: false,
                verifiedAt: now,
                verifiedById: admin.id,
                verificationNote: reason,
              },
              include: { user: { select: { id: true, name: true, email: true } } },
            });
          default:
            throw new Error("Unknown action");
        }
      }),
    );

    await prisma.adminAuditLog.createMany({
      data: ids.map((id) => ({
        actorId: admin.id,
        action: `EMPLOYER_${action.toUpperCase()}`,
        targetType: "employerProfile",
        targetId: id,
        details: reason ? { reason } : null,
      })),
    });

    return NextResponse.json({ success: true, profiles: updates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to update employer(s). Please try again." },
      { status: 500 },
    );
  }
}
