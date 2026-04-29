import { NextResponse } from "next/server";
import { runShort } from "@/lib/firecrawl-client";
import { validateUrl } from "@/lib/url-validation";
import { rateLimitGuard, handleApiError, missingApiKey } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const body = await request.json();
    const urlCheck = validateUrl(body.url ?? "");
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const result = await runShort((sdk) =>
      sdk.scrape(urlCheck.url, { formats: ["markdown", "changeTracking"] })
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
