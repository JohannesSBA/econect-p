import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "@/lib/errors";

// Next.js 15 route handler context — params are async
export type RouteContext = { params: Promise<Record<string, string>> };
type InnerHandler = (req: NextRequest, ctx?: RouteContext) => Promise<NextResponse>;

// First overload satisfies Next.js build type checker (ctx required).
// Second overload allows tests to call without ctx.
interface RouteHandler {
  (req: NextRequest, ctx: RouteContext): Promise<NextResponse>;
  (req: NextRequest): Promise<NextResponse>;
}

export function withHandler(handler: InnerHandler): RouteHandler {
  return (async (req: NextRequest, ctx?: RouteContext) => {
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
  }) as RouteHandler;
}
