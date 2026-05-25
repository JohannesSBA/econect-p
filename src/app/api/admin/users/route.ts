import { NextRequest, NextResponse } from "next/server";

import { Prisma, UserRole } from "@/generated/prisma";
import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { adminUserActionSchema } from "@/lib/validation/users";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const role = searchParams.get("role") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? searchParams.get("limit") ?? 25)),
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const filters: Prisma.UserWhereInput[] = [];
  if (query) {
    filters.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (role && role in UserRole) filters.push({ role: role as UserRole });
  if (status === "suspended") filters.push({ isSuspended: true });
  else if (status === "shadow") filters.push({ shadowBanned: true });

  const where = filters.length ? { AND: filters } : {};
  const [total, result] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        location: true,
        createdAt: true,
        isSuspended: true,
        suspendedAt: true,
        shadowBanned: true,
        employerProfile: { select: { isVerified: true, companyName: true } },
        _count: { select: { posts: true, comments: true, jobListings: true } },
      },
    }),
  ]);

  const users = result.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    location: u.location,
    createdAt: u.createdAt.toISOString(),
    isSuspended: u.isSuspended,
    suspendedAt: u.suspendedAt?.toISOString() ?? null,
    shadowBanned: u.shadowBanned,
    employerProfile: u.employerProfile,
    stats: { posts: u._count.posts, comments: u._count.comments, jobListings: u._count.jobListings },
  }));

  return NextResponse.json({ users, total, page, pageSize });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();
  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.errors[0]?.message ?? "Invalid request");
  }

  const { action, userId } = parsed.data;
  let updatedUser;

  switch (action) {
    case "suspend":
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true, suspendedAt: new Date() },
      });
      break;
    case "unsuspend":
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isSuspended: false, suspendedAt: null },
      });
      break;
    case "assignRole":
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: (parsed.data as { role: UserRole }).role },
      });
      break;
    case "shadow":
      updatedUser = await prisma.user.update({ where: { id: userId }, data: { shadowBanned: true } });
      break;
    case "unshadow":
      updatedUser = await prisma.user.update({ where: { id: userId }, data: { shadowBanned: false } });
      break;
    case "resetContact": {
      const { email, phone } = parsed.data as { email?: string; phone?: string };
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { ...(email ? { email } : {}), ...(phone ? { phone } : {}) },
      });
      break;
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updatedUser!.id,
      role: updatedUser!.role,
      isSuspended: updatedUser!.isSuspended,
      suspendedAt: updatedUser!.suspendedAt,
      shadowBanned: updatedUser!.shadowBanned,
      email: updatedUser!.email,
      phone: updatedUser!.phone,
    },
  });
});
