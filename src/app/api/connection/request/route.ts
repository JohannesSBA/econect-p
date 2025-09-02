import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/connection/request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.id === userId) return NextResponse.json({ error: "Cannot connect to self" }, { status: 400 });
  // Check if already exists
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Already requested or connected" }, { status: 400 });
  const conn = await prisma.connection.create({
    data: { senderId: user.id, receiverId: userId, status: "PENDING" },
  });
  // Notify receiver
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'CONNECTION_REQUEST',
      title: 'New connection request',
      message: `${user.name} sent you a connection request`,
      data: { senderId: user.id },
    },
  });
  return NextResponse.json(conn);
}
