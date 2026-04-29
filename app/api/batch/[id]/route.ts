import { NextResponse } from "next/server";
import { cancelJob, getJob } from "@/lib/job-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: Params) {
  const { id } = await props.params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: job.id,
    firecrawlId: job.firecrawlId,
    status: job.status,
    total: job.total,
    completed: job.completed,
    data: job.data,
    error: job.error,
    createdAt: job.createdAt,
  });
}

export async function DELETE(_request: Request, props: Params) {
  const { id } = await props.params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  cancelJob(id);
  return NextResponse.json({ status: "cancelled" });
}
