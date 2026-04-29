import Firecrawl from "@mendable/firecrawl-js";
import { gate, QueueTimeoutError } from "./concurrency";

const apiKey = process.env.FIRECRAWL_API_KEY ?? "";

export const firecrawl = new Firecrawl({ apiKey });

export async function runShort<T>(
  fn: (sdk: Firecrawl) => Promise<T>,
): Promise<T> {
  const { release } = await gate.acquire({ timeoutMs: 30_000 });
  try {
    return await fn(firecrawl);
  } finally {
    release();
  }
}

interface RunJobOpts<TStart, TPoll> {
  start: (sdk: Firecrawl) => Promise<TStart>;
  getIdFromStart: (result: TStart) => string;
  poll: (sdk: Firecrawl, id: string) => Promise<TPoll>;
  isTerminal: (result: TPoll) => boolean;
  pollIntervalMs?: number;
  maxMs?: number;
  signal?: AbortSignal;
}

export async function runJob<TStart, TPoll>(
  opts: RunJobOpts<TStart, TPoll>,
): Promise<{
  startResult: TStart;
  finalResult: TPoll | null;
  firecrawlId: string;
}> {
  const pollInterval = opts.pollIntervalMs ?? 3_000;
  const maxMs =
    opts.maxMs ??
    Number(process.env.FIRECRAWL_JOB_TIMEOUT_MS ?? 30 * 60 * 1000);

  const { release } = await gate.acquire({
    timeoutMs: 30_000,
    signal: opts.signal,
  });
  try {
    const startResult = await opts.start(firecrawl);
    const firecrawlId = opts.getIdFromStart(startResult);
    const startTime = Date.now();

    let finalResult: TPoll | null = null;
    while (true) {
      if (opts.signal?.aborted) break;
      if (Date.now() - startTime > maxMs) break;

      await sleep(pollInterval);
      if (opts.signal?.aborted) break;

      const pollResult = await opts.poll(firecrawl, firecrawlId);
      finalResult = pollResult;

      if (opts.isTerminal(pollResult)) break;
    }

    return { startResult, finalResult, firecrawlId };
  } finally {
    release();
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { QueueTimeoutError };
