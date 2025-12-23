import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@/generated/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return currentUser;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) {
      return response;
    }
    throw response;
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const role = searchParams.get("role") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const pageSize = Math.min(
    100,
    Math.max(
      1,
      Number(searchParams.get("pageSize") ?? searchParams.get("limit") ?? 25),
    ),
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
  if (role && role in UserRole) {
    filters.push({ role: role as UserRole });
  }
  if (status === "suspended") {
    filters.push({ isSuspended: true });
  } else if (status === "shadow") {
    filters.push({ shadowBanned: true });
  }

  const where = filters.length ? { AND: filters } : {};

  const total = await prisma.user.count({ where });
  const result = await prisma.user.findMany({
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
      employerProfile: {
        select: {
          isVerified: true,
          companyName: true,
        },
      },
      _count: {
        select: {
          posts: true,
          comments: true,
          jobListings: true,
        },
      },
    },
  });

  const users = result.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location,
    createdAt: user.createdAt.toISOString(),
    isSuspended: user.isSuspended,
    suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : null,
    shadowBanned: user.shadowBanned,
    employerProfile: user.employerProfile,
    stats: {
      posts: user._count.posts,
      comments: user._count.comments,
      jobListings: user._count.jobListings,
    },
  }));

  return NextResponse.json({ users, total, page, pageSize });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) {
      return response;
    }
    throw response;
  }

  const body = await req.json();
  const { action, userId } = body as {
    action?: string;
    userId?: string;
    value?: string;
    email?: string;
    phone?: string;
    role?: string;
  };

  if (!action || !userId) {
    return NextResponse.json(
      { error: "action and userId are required" },
      { status: 400 },
    );
  }

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
    case "assignRole": {
      const newRole = body.role as keyof typeof UserRole | undefined;
      if (!newRole || !(newRole in UserRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      break;
    }
    case "shadow":
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { shadowBanned: true },
      });
      break;
    case "unshadow":
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { shadowBanned: false },
      });
      break;
    case "resetContact": {
      const { email, phone } = body as {
        email?: string;
        phone?: string;
      };
      if (!email && !phone) {
        return NextResponse.json(
          { error: "Email or phone required" },
          { status: 400 },
        );
      }
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      role: updatedUser.role,
      isSuspended: updatedUser.isSuspended,
      suspendedAt: updatedUser.suspendedAt,
      shadowBanned: updatedUser.shadowBanned,
      email: updatedUser.email,
      phone: updatedUser.phone,
    },
  });
}
