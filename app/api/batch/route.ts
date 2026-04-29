import { NextResponse } from "next/server";
import { runJob } from "@/lib/firecrawl-client";
import { validateUrls } from "@/lib/url-validation";
import { rateLimitGuard, handleApiError, missingApiKey } from "@/lib/api-helpers";
import { createJob, updateJob } from "@/lib/job-store";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const { urls, formats = ["markdown"] } = await request.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: "At least one URL is required" }, { status: 400 });
    }

    const urlCheck = validateUrls(urls);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const job = createJob("batch", "");

    runJob({
      start: async (sdk) => {
        const r = await (sdk as unknown as {
          startBatchScrape: (urls: string[], opts: Record<string, unknown>) => Promise<{ id: string }>;
        }).startBatchScrape(urlCheck.urls, { options: { formats } });
        updateJob(job.id, { firecrawlId: r.id });
        return r;
      },
      getIdFromStart: (r) => r.id,
      poll: async (sdk, id) => {
        return await (sdk as unknown as {
          getBatchScrapeStatus: (id: string) => Promise<Record<string, unknown>>;
        }).getBatchScrapeStatus(id);
      },
      isTerminal: (r) => {
        const status = r.status as string;
        return ["completed", "failed", "cancelled"].includes(status);
      },
      signal: job.abort.signal,
    }).then(({ finalResult, firecrawlId }) => {
      const r = finalResult as Record<string, unknown> | null;
      updateJob(job.id, {
        firecrawlId,
        status: (r?.status as "completed" | "failed") ?? "failed",
        total: r?.total as number | undefined,
        completed: r?.completed as number | undefined,
        data: r?.data,
      });
    }).catch((err) => {
      updateJob(job.id, { status: "failed", error: err instanceof Error ? err.message : "Unknown error" });
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return handleApiError(error);
  }
}
