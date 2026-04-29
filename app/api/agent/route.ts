import { NextResponse } from "next/server";
import { runShort } from "@/lib/firecrawl-client";
import { validateUrls } from "@/lib/url-validation";
import { rateLimitGuard, handleApiError, missingApiKey } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { prompt, urls, schema, model = "spark-1-mini", maxCredits = 100 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (urls && urls.length > 0) {
      const urlCheck = validateUrls(urls);
      if (!urlCheck.valid) {
        return NextResponse.json({ error: urlCheck.error }, { status: 400 });
      }
    }

    const opts: Record<string, unknown> = { prompt, model, maxCredits };
    if (urls && urls.length > 0) opts.urls = urls;
    if (schema) opts.schema = schema;

    const result = await runShort((sdk) => (sdk as unknown as { agent: (opts: Record<string, unknown>) => Promise<unknown> }).agent(opts));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
