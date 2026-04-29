"use client";

import { ListChecks, Loader2, Square } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useHistory } from "@/hooks/use-history";

interface JobState {
  id: string;
  status: string;
  total?: number;
  completed?: number;
  data?: unknown;
  error?: string;
}

export default function BatchPanel() {
  const [urlsText, setUrlsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addEntry } = useHistory("batch");

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
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setLoading(true);
    setJob(null);
    stopPolling();

    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch scrape failed");

      const jobId = data.jobId;
      setJob({ id: jobId, status: "running" });
      toast.success("Batch scrape started");
      addEntry({ urls }, `${urls.length} URLs`);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/batch/${jobId}`);
          const pollData = await pollRes.json();
          setJob(pollData);

          if (["completed", "failed", "cancelled"].includes(pollData.status)) {
            stopPolling();
            if (pollData.status === "completed")
              toast.success("Batch scrape complete");
            else if (pollData.status === "failed")
              toast.error(pollData.error || "Batch scrape failed");
          }
        } catch {}
      }, 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch scrape failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async () => {
    if (!job) return;
    try {
      await fetch(`/api/batch/${job.id}`, { method: "DELETE" });
      toast.info("Batch scrape cancelled");
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
        <h1 className="text-2xl font-bold tracking-tight">Batch Scrape</h1>
        <p className="text-muted-foreground">
          Scrape multiple URLs in a single job
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URLs</CardTitle>
          <CardDescription>Enter one URL per line</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URLs (one per line)</Label>
            <Textarea
              placeholder={
                "https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"
              }
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || isRunning || !urlsText.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Batch
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
            icon={ListChecks}
            title="No batch job running"
            description="Enter URLs and start a batch scrape job"
          />
        )
      )}
    </div>
  );
}
