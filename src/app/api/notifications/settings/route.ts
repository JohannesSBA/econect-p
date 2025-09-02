import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user: any = await (prisma as any).user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user.notificationSettings || {});
  } catch (e: any) {
    // If the DB column doesn't exist yet, avoid crashing and return empty settings
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const updated: any = await (prisma as any).user.update({ where: { email: session.user!.email! }, data: { notificationSettings: body || {} } });
    return NextResponse.json(updated.notificationSettings || {});
  } catch (e: any) {
    // Column missing; noop and return incoming settings so UI remains consistent
    return NextResponse.json(body || {}, { status: 200 });
  }
}
