import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { getRequestLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimiter";
import { chapaCheckoutSchema } from "@/lib/validation/payments";
import { initiateChapaCheckout } from "@/services/payments";

export const POST = withHandler(async (req: NextRequest) => {
  const rl = rateLimit(req, "payments:checkout", 5, 15 * 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many payment requests. Retry in ${rl.retryAfterSeconds}s.`);

  const logger = getRequestLogger(req, { route: "api:payments:chapa:checkout" });
  const user = await requireUser();

  const parsed = chapaCheckoutSchema.parse(await req.json());

  const result = await initiateChapaCheckout({ user, payload: parsed, logger });
  return NextResponse.json(result);
});
