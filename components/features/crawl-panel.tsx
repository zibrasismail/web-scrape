"use client";

import { Layers, Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultViewer } from "@/components/shared/result-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useHistory } from "@/hooks/use-history";
import { apiFetch, showApiError } from "@/lib/client-helpers";

interface JobState {
  id: string;
  status: string;
  total?: number;
  completed?: number;
  data?: unknown;
  error?: string;
}

export default function CrawlPanel() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(20);
  const [maxDepth, setMaxDepth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addEntry } = useHistory("crawl");

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setJob(null);
    stopPolling();

    try {
      const data = await apiFetch<Record<string, unknown>>("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          limit,
          maxDiscoveryDepth: maxDepth,
        }),
      });

      const jobId = data.jobId as string;
      setJob({ id: jobId, status: "running" });
      toast.success("Crawl started");
      addEntry({ url, limit, maxDepth }, url);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/crawl/${jobId}`);
          const pollData = await pollRes.json();
          setJob(pollData);

          if (["completed", "failed", "cancelled"].includes(pollData.status)) {
            stopPolling();
            if (pollData.status === "completed")
              toast.success("Crawl complete");
            else if (pollData.status === "failed")
              toast.error(pollData.error || "Crawl failed");
          }
        } catch {}
      }, 3000);
    } catch (err) {
      showApiError(err, "Crawl failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async () => {
    if (!job) return;
    try {
      await fetch(`/api/crawl/${job.id}`, { method: "DELETE" });
      toast.info("Crawl cancelled");
      stopPolling();
      setJob((prev) => (prev ? { ...prev, status: "cancelled" } : null));
    } catch {}
  };

  const isRunning = job?.status === "running" || job?.status === "queued";
  const progress =
    job?.total && job.completed
      ? Math.round((job.completed / job.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crawl</h1>
        <p className="text-muted-foreground">
          Crawl an entire website and extract content from all pages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Set the starting URL and crawl parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Page limit</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max depth</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || isRunning || !url.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Crawl
            </Button>
            {isRunning && (
              <Button variant="destructive" size="sm" onClick={cancelJob}>
                <Square className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {job && (
        <Card>
          <CardHeader className="py-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">Job Status</CardTitle>
            <Badge
              variant={
                job.status === "completed"
                  ? "success"
                  : job.status === "failed"
                    ? "destructive"
                    : "warning"
              }
            >
              {job.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {isRunning && <Progress value={progress} />}
            {job.total !== undefined && (
              <p className="text-xs text-muted-foreground">
                {job.completed ?? 0} / {job.total} pages
              </p>
            )}
            {job.error && (
              <p className="text-xs text-destructive">{job.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {job?.data ? (
        <ResultViewer data={{ data: job.data }} />
      ) : (
        !isRunning &&
        !loading && (
          <EmptyState
            icon={Layers}
            title="No crawl running"
            description="Configure and start a crawl to extract content from multiple pages"
          />
        )
      )}
    </div>
  );
}
