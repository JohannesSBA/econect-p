import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { id } = await params;
  const body = await req.json();
  const read = typeof body?.read === 'boolean' ? body.read : undefined;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = await prisma.notification.update({ where: { id }, data: { read: read ?? notif.read } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

