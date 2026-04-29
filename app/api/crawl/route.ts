import { NextResponse } from "next/server";
import {
  handleApiError,
  missingApiKey,
  rateLimitGuard,
} from "@/lib/api-helpers";
import { runJob } from "@/lib/firecrawl-client";
import { createJob, updateJob } from "@/lib/job-store";
import { validateUrl } from "@/lib/url-validation";

export async function POST(request: Request) {
  const rlBlock = rateLimitGuard(request);
  if (rlBlock) return rlBlock;
  const keyBlock = missingApiKey();
  if (keyBlock) return keyBlock;

  try {
    const body = await request.json();
    const {
      limit = 20,
      maxDiscoveryDepth = 3,
      excludePaths,
      includePaths,
    } = body;

    const urlCheck = validateUrl(body.url ?? "");
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const opts: Record<string, unknown> = {
      limit: Math.min(Math.max(limit, 1), 100),
      maxDiscoveryDepth,
    };
    if (excludePaths) opts.excludePaths = excludePaths;
    if (includePaths) opts.includePaths = includePaths;

    const job = createJob("crawl", "");

    runJob({
      start: async (sdk) => {
        const r = await (
          sdk as unknown as {
            startCrawl: (
              url: string,
              opts: Record<string, unknown>,
            ) => Promise<{ id: string }>;
          }
        ).startCrawl(urlCheck.url, opts);
        updateJob(job.id, { firecrawlId: r.id });
        return r;
      },
      getIdFromStart: (r) => r.id,
      poll: async (sdk, id) => {
        return await (
          sdk as unknown as {
            getCrawlStatus: (id: string) => Promise<Record<string, unknown>>;
          }
        ).getCrawlStatus(id);
      },
      isTerminal: (r) => {
        const status = r.status as string;
        return ["completed", "failed", "cancelled"].includes(status);
      },
      signal: job.abort.signal,
    })
      .then(({ finalResult, firecrawlId }) => {
        const r = finalResult as Record<string, unknown> | null;
        updateJob(job.id, {
          firecrawlId,
          status: (r?.status as "completed" | "failed") ?? "failed",
          total: r?.total as number | undefined,
          completed: r?.completed as number | undefined,
          data: r?.data,
        });
      })
      .catch((err) => {
        updateJob(job.id, {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return handleApiError(error);
  }
}
