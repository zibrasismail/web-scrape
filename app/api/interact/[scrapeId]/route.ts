import { NextResponse } from "next/server";
import {
  handleApiError,
  missingApiKey,
  rateLimitGuard,
} from "@/lib/api-helpers";
import { runShort } from "@/lib/firecrawl-client";

type Params = { params: Promise<{ scrapeId: string }> };

export async function POST(request: Request, props: Params) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { scrapeId } = await props.params;
    const { prompt, code } = await request.json();

    if (!prompt && !code) {
      return NextResponse.json(
        { error: "Either prompt or code is required" },
        { status: 400 },
      );
    }

    const opts: Record<string, unknown> = {};
    if (prompt) opts.prompt = prompt;
    if (code) opts.code = code;

    const result = await runShort((sdk) =>
      (
        sdk as unknown as {
          interact: (
            id: string,
            opts: Record<string, unknown>,
          ) => Promise<unknown>;
        }
      ).interact(scrapeId, opts),
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, props: Params) {
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { scrapeId } = await props.params;

    const result = await runShort((sdk) =>
      (
        sdk as unknown as { stopInteraction: (id: string) => Promise<unknown> }
      ).stopInteraction(scrapeId),
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
