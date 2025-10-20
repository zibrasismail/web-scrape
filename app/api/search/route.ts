import Firecrawl from "@mendable/firecrawl-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
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

    const result = await firecrawl.search(query, {
      limit: Math.min(Math.max(limit, 1), 20),
    });

    console.log("Search result:", JSON.stringify(result, null, 2));

    // Firecrawl search returns results in a 'web' array
    const results = result.web || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to perform search",
      },
      { status: 500 }
    );
  }
}
