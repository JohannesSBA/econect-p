import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/connection/accept
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // Find pending connection
  const conn = await prisma.connection.findFirst({
    where: { senderId: userId, receiverId: user.id, status: "PENDING" },
  });
  if (!conn) return NextResponse.json({ error: "No pending request" }, { status: 404 });
  const updated = await prisma.connection.update({
    where: { id: conn.id },
    data: { status: "ACCEPTED" },
  });
  // Notify sender
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'CONNECTION_REQUEST',
      title: 'Connection accepted',
      message: `${user.name} accepted your connection request`,
      data: { receiverId: user.id },
    }
  })
  return NextResponse.json(updated);
}
