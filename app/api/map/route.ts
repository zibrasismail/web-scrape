import { NextResponse } from "next/server";
import {
  handleApiError,
  missingApiKey,
  rateLimitGuard,
} from "@/lib/api-helpers";
import { runShort } from "@/lib/firecrawl-client";
import { validateUrl } from "@/lib/url-validation";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const body = await request.json();
    const { limit = 10, search, includeSubdomains, sitemap } = body;

    const urlCheck = validateUrl(body.url ?? "");
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const opts: Record<string, unknown> = {
      limit: Math.min(Math.max(limit, 1), 100),
    };
    if (search) opts.search = search;
    if (includeSubdomains !== undefined)
      opts.includeSubdomains = includeSubdomains;
    if (sitemap) opts.sitemap = sitemap;

    const result = await runShort((sdk) => sdk.map(urlCheck.url, opts));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
