import { NextResponse } from "next/server";
import { runShort } from "@/lib/firecrawl-client";
import { rateLimitGuard, handleApiError, missingApiKey } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { query, limit = 10, scrapeOptions } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const opts: Record<string, unknown> = {
      limit: Math.min(Math.max(limit, 1), 20),
    };
    if (scrapeOptions) opts.scrapeOptions = scrapeOptions;

    const result = await runShort((sdk) => sdk.search(query, opts));
    const results = (result as Record<string, unknown>).web || [];

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
