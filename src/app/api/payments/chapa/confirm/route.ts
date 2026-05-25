import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import { chapaConfirmSchema } from "@/lib/validation/payments";
import { confirmChapaPayment } from "@/services/payments";

export const POST = withHandler(async (req: NextRequest) => {
  const logger = getRequestLogger(req, { route: "api:payments:chapa:confirm" });
  const user = await requireUser();

  const parsed = chapaConfirmSchema.parse(await req.json());

  const result = await confirmChapaPayment({ user, paymentId: parsed.paymentId, logger });
  return NextResponse.json(result);
});
