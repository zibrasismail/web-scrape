import { NextResponse } from "next/server";
import {
  handleApiError,
  missingApiKey,
  rateLimitGuard,
} from "@/lib/api-helpers";
import { runShort } from "@/lib/firecrawl-client";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const optionsRaw = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50 MB limit" },
        { status: 400 },
      );
    }

    let options: Record<string, unknown> = {};
    if (optionsRaw) {
      try {
        options = JSON.parse(optionsRaw);
      } catch {
        return NextResponse.json(
          { error: "Invalid options JSON" },
          { status: 400 },
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await runShort((sdk) =>
      (
        sdk as unknown as {
          parse: (
            opts: { data: Buffer; filename: string } & Record<string, unknown>,
          ) => Promise<unknown>;
        }
      ).parse({ data: buffer, filename: file.name, ...options }),
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
