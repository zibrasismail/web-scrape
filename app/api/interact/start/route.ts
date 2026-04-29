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
    const { url, formats = ["markdown"] } = await request.json();

    const urlCheck = validateUrl(url ?? "");
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const result = await runShort((sdk) =>
      sdk.scrape(urlCheck.url, { formats }),
    );
    const data = result as Record<string, unknown>;
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const scrapeId = metadata?.scrapeId as string | undefined;

    return NextResponse.json({
      scrapeId,
      metadata,
      markdown: data.markdown,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
