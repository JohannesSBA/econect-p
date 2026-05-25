import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { HttpError } from "@/lib/errors";
import { getRequestLogger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { chapaConfirmSchema } from "@/lib/validation/payments";
import { confirmChapaPayment } from "@/services/payments";

// POST /api/payments/chapa/confirm
// Verifies a payment against Chapa (or forces success in dev mode)
export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:payments:chapa:confirm" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const parsed = chapaConfirmSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  try {
    const result = await confirmChapaPayment({
      user,
      paymentId: parsed.data.paymentId,
      logger,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Payment confirmation failed", { error });
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
