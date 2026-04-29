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
        headers: {
          "Retry-After": String(
            Math.ceil((result.retryAfterMs ?? 1000) / 1000),
          ),
        },
      },
    );
  }
  return null;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof QueueTimeoutError) {
    return NextResponse.json(
      {
        error: "Server busy, please retry",
        code: "QUEUE_TIMEOUT",
        waitedMs: error.waitedMs,
      },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return NextResponse.json(
      { error: "Request cancelled", code: "CANCELLED" },
      { status: 499 },
    );
  }

  const isDev = process.env.NODE_ENV === "development";
  const details = extractErrorDetails(error);
  console.error("[API Error]", {
    message: details.message,
    code: details.code,
    statusCode: details.statusCode,
    firecrawlDetails: details.firecrawlDetails,
    stack: error instanceof Error ? error.stack : undefined,
  });

  const status = details.statusCode ?? 500;
  const body: Record<string, unknown> = {
    error: details.message,
    code: details.code,
  };
  if (details.firecrawlDetails) body.details = details.firecrawlDetails;
  if (isDev && error instanceof Error) body.stack = error.stack;

  return NextResponse.json(body, { status });
}

function extractErrorDetails(error: unknown): {
  message: string;
  code: string;
  statusCode: number | null;
  firecrawlDetails: unknown;
} {
  if (!(error instanceof Error)) {
    return {
      message: "Internal server error",
      code: "UNKNOWN",
      statusCode: null,
      firecrawlDetails: null,
    };
  }

  const errObj = error as unknown as Record<string, unknown>;
  const statusCode =
    typeof errObj.statusCode === "number"
      ? errObj.statusCode
      : typeof errObj.status === "number"
        ? errObj.status
        : null;

  const firecrawlDetails =
    errObj.response ?? errObj.body ?? errObj.data ?? null;

  let code = "API_ERROR";
  if (statusCode === 401 || statusCode === 403) code = "AUTH_ERROR";
  else if (statusCode === 402) code = "PAYMENT_REQUIRED";
  else if (statusCode === 429) code = "FIRECRAWL_RATE_LIMIT";
  else if (statusCode === 400) code = "BAD_REQUEST";
  else if (statusCode && statusCode >= 500) code = "FIRECRAWL_SERVER_ERROR";

  return {
    message: error.message || "Internal server error",
    code,
    statusCode,
    firecrawlDetails,
  };
}

export function missingApiKey(): NextResponse | null {
  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json(
      { error: "FIRECRAWL_API_KEY not configured", code: "NO_API_KEY" },
      { status: 500 },
    );
  }
  return null;
}
