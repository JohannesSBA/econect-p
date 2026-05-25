import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { HttpError } from "@/lib/errors";
import { getRequestLogger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { chapaCheckoutSchema } from "@/lib/validation/payments";
import { initiateChapaCheckout } from "@/services/payments";

export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:payments:chapa:checkout" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = chapaCheckoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await initiateChapaCheckout({
      user,
      payload: parsed.data,
      logger,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Checkout error", { error });
    return NextResponse.json({ error: "Payment processor error" }, { status: 500 });
  }
}
