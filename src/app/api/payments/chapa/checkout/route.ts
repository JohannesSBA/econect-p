import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import { chapaCheckoutSchema } from "@/lib/validation/payments";
import { initiateChapaCheckout } from "@/services/payments";

export const POST = withHandler(async (req: NextRequest) => {
  const logger = getRequestLogger(req, { route: "api:payments:chapa:checkout" });
  const user = await requireUser();

  const parsed = chapaCheckoutSchema.parse(await req.json());

  const result = await initiateChapaCheckout({ user, payload: parsed, logger });
  return NextResponse.json(result);
});
