import { NextResponse } from "next/server";
import {
  handleApiError,
  missingApiKey,
  rateLimitGuard,
} from "@/lib/api-helpers";
import { runShort } from "@/lib/firecrawl-client";
import { validateUrls } from "@/lib/url-validation";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { urls, prompt, schema, enableWebSearch, allowExternalLinks } =
      await request.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: "At least one URL is required" },
        { status: 400 },
      );
    }

    const urlCheck = validateUrls(urls);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const options: Record<string, unknown> = { urls: urlCheck.urls };
    if (prompt) options.prompt = prompt;
    if (schema) options.schema = schema;
    if (enableWebSearch !== undefined)
      options.enableWebSearch = enableWebSearch;
    if (allowExternalLinks !== undefined)
      options.allowExternalLinks = allowExternalLinks;

    const result = await runShort((sdk) => sdk.extract(options));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
