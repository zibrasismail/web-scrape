import Firecrawl from "@mendable/firecrawl-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, formats = ["markdown"] } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY not configured" },
        { status: 500 }
      );
    }

    const firecrawl = new Firecrawl({ apiKey });

    const result = await firecrawl.scrape(url, { formats });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
