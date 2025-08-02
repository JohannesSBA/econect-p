import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/connection/reject
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
    data: { status: "REJECTED" },
  });
  // Optionally: create notification for sender
  return NextResponse.json(updated);
}


// GET /api/connection/status?userId=...
export async function GET(req: NextRequest  ) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const conn = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });
  return NextResponse.json(conn || {});
}
