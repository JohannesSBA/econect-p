import { NextRequest, NextResponse } from "next/server";

import { PaymentStatus } from "@/generated/prisma";
import { withHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)));
  const status = searchParams.get("status") ?? undefined;

  const [payments, aggregates] = await Promise.all([
    prisma.payment.findMany({
      where: status ? { status: status as PaymentStatus } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        employer: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({ payments, aggregates });
});
