import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  reset: number;
};

// Keep buckets in-memory; in a multi-instance setup use a shared store (Redis, Upstash, etc.).
const globalKey = "__rateLimiterBuckets";
const buckets: Map<string, Bucket> =
  (globalThis as any)[globalKey] || new Map<string, Bucket>();
(globalThis as any)[globalKey] = buckets;

const getClientIdentifier = (req: NextRequest) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (req as any).ip || "unknown";
};

export function rateLimit(
  req: NextRequest,
  key: string,
  limit = 5,
  windowMs = 5 * 60 * 1000,
) {
  const now = Date.now();
  const id = `${key}:${getClientIdentifier(req)}`;
  const bucket = buckets.get(id);

  if (!bucket || bucket.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.max(0, bucket.reset - now);
    return {
      allowed: false,
      remaining: 0,
      reset: bucket.reset,
      retryAfterSeconds: Math.ceil(retryAfter / 1000),
    };
  }

  bucket.count += 1;
  buckets.set(id, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.count,
    reset: bucket.reset,
  };
}
