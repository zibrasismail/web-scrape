import { NextResponse } from "next/server";
import { QueueTimeoutError } from "./concurrency";
import { checkRateLimit } from "./rate-limit";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}

export function rateLimitGuard(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((result.retryAfterMs ?? 1000) / 1000)) },
      }
    );
  }
  return null;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof QueueTimeoutError) {
    return NextResponse.json(
      { error: "Server busy, please retry", code: "QUEUE_TIMEOUT", waitedMs: error.waitedMs },
      { status: 503, headers: { "Retry-After": "5" } }
    );
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return NextResponse.json({ error: "Request cancelled", code: "CANCELLED" }, { status: 499 });
  }
  console.error("API error:", error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Internal server error" },
    { status: 500 }
  );
}

export function missingApiKey(): NextResponse | null {
  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json(
      { error: "FIRECRAWL_API_KEY not configured", code: "NO_API_KEY" },
      { status: 500 }
    );
  }
  return null;
}
