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
    const {
      formats = ["markdown"],
      onlyMainContent,
      waitFor,
      mobile,
      maxAge,
    } = body;

    const urlCheck = validateUrl(body.url ?? "");
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const opts: Record<string, unknown> = { formats };
    if (onlyMainContent !== undefined) opts.onlyMainContent = onlyMainContent;
    if (waitFor) opts.waitFor = waitFor;
    if (mobile !== undefined) opts.mobile = mobile;
    if (maxAge) opts.maxAge = maxAge;

    const result = await runShort((sdk) => sdk.scrape(urlCheck.url, opts));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
