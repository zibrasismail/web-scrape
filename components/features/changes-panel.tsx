"use client";

import { GitCompare, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultViewer } from "@/components/shared/result-viewer";
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
import { useHistory } from "@/hooks/use-history";
import { apiFetch, showApiError } from "@/lib/client-helpers";

export default function ChangesPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { addEntry } = useHistory("changes");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const data = await apiFetch<Record<string, unknown>>("/api/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: abortRef.current.signal,
      });
      setResult(data);
      addEntry({ url }, url);
      toast.success("Change tracking complete");
    } catch (err) {
      showApiError(err, "Change tracking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Change Tracking</h1>
        <p className="text-muted-foreground">
          Track content changes on a webpage over time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Enter the URL to track changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !url.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Tracking..." : "Track Changes"}
            </Button>
            {loading && (
              <Button
                variant="outline"
                onClick={() => abortRef.current?.abort()}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result ? (
        <ResultViewer data={result} />
      ) : (
        !loading && (
          <EmptyState
            icon={GitCompare}
            title="No results yet"
            description="Enter a URL to track content changes"
          />
        )
      )}
    </div>
  );
}
