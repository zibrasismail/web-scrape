import { randomUUID } from "crypto";

export type JobKind = "crawl" | "batch" | "agent";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobRecord {
  id: string;
  kind: JobKind;
  firecrawlId: string;
  status: JobStatus;
  total?: number;
  completed?: number;
  creditsUsed?: number;
  data?: unknown;
  error?: string;
  createdAt: number;
  updatedAt: number;
  abort: AbortController;
}

const store = new Map<string, JobRecord>();
const GC_DELAY_MS = 60 * 60 * 1000;

export function createJob(kind: JobKind, firecrawlId: string): JobRecord {
  const job: JobRecord = {
    id: randomUUID(),
    kind,
    firecrawlId,
    status: "running",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    abort: new AbortController(),
  };
  store.set(job.id, job);
  return job;
}

export function getJob(id: string): JobRecord | undefined {
  return store.get(id);
}

export function updateJob(id: string, patch: Partial<Omit<JobRecord, "id" | "kind" | "abort">>) {
  const job = store.get(id);
  if (!job) return;
  Object.assign(job, patch, { updatedAt: Date.now() });
  if (isTerminal(job.status)) {
    setTimeout(() => store.delete(id), GC_DELAY_MS);
  }
}

export function cancelJob(id: string) {
  const job = store.get(id);
  if (!job) return;
  job.abort.abort();
  updateJob(id, { status: "cancelled" });
}

export function listJobs(kind?: JobKind): JobRecord[] {
  const results: JobRecord[] = [];
  for (const job of store.values()) {
    if (!kind || job.kind === kind) results.push(job);
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

function isTerminal(status: JobStatus) {
  return status === "completed" || status === "failed" || status === "cancelled";
}
