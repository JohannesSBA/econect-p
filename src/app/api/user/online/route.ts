import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/user/online { isOnline: boolean }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { isOnline } = await req.json();
  const now = new Date();

  await prisma.userOnlineStatus.upsert({
    where: { userId: user.id },
    create: { userId: user.id, isOnline: !!isOnline, lastSeen: now },
    update: { isOnline: !!isOnline, lastSeen: now },
  });

  return NextResponse.json({ ok: true });
}

// GET /api/user/online
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { onlineStatus: true } as any });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const status = await prisma.userOnlineStatus.findUnique({ where: { userId: user.id } });
  return NextResponse.json(status || { isOnline: false });
}

