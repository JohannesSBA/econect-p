import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma";

async function requireAdmin() {
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
    await requireAdmin();
  } catch (response) {
    if (response instanceof NextResponse) return response;
    throw response;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 25)),
  );
  const status = searchParams.get("status") ?? undefined;

  const payments = await prisma.payment.findMany({
    where: status
      ? {
          status: status as PaymentStatus,
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      employer: { select: { id: true, name: true, email: true } },
      job: { select: { id: true, title: true } },
    },
  });

  const aggregates = await prisma.payment.groupBy({
    by: ["status"],
    _count: { status: true },
    _sum: { amount: true },
  });

  return NextResponse.json({ payments, aggregates });
}

