import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "@/lib/errors";

// Next.js 15 route handler context — params are async
type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, ctx?: RouteContext) => Promise<NextResponse>;

export function withHandler(handler: Handler): Handler {
  return async (req, ctx?) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten() },
          { status: 400 },
        );
      }
      console.error("Unhandled route error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
