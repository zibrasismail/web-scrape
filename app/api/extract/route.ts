import Firecrawl from "@mendable/firecrawl-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { urls, prompt, schema } = await request.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: "At least one URL is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY not configured" },
        { status: 500 }
      );
    }

    const firecrawl = new Firecrawl({ apiKey });

    const options: {
      urls: string[];
      prompt?: string;
      schema?: Record<string, unknown>;
    } = { urls };

    if (prompt) {
      options.prompt = prompt;
    }

    if (schema) {
      options.schema = schema;
    }

    const result = await firecrawl.extract(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract data" },
      { status: 500 }
    );
  }
}
