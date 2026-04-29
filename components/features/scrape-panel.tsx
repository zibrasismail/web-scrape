"use client";

import { Globe, History, Loader2, Trash2 } from "lucide-react";
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

const FORMAT_OPTIONS = [
  "markdown",
  "html",
  "rawHtml",
  "screenshot",
  "links",
  "json",
];

export default function ScrapePanel() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState<string[]>(["markdown"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { entries, addEntry, clearHistory } = useHistory("scrape");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), formats }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scrape failed");
      setResult(data);
      addEntry({ url, formats }, url);
      toast.success("Scrape complete");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleFormat = (fmt: string) => {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scrape</h1>
          <p className="text-muted-foreground">
            Extract content from a single URL
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </div>

      {showHistory && entries.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearHistory}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="space-y-1">
              {entries.slice(0, 5).map((e) => (
                <button
                  type="button"
                  key={e.id}
                  className="w-full text-left text-xs truncate px-2 py-1 rounded hover:bg-muted"
                  onClick={() => {
                    setUrl(e.input.url as string);
                    setShowHistory(false);
                  }}
                >
                  {e.preview}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Enter the URL and select output formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scrape-url">URL</Label>
            <Input
              id="scrape-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label>Formats</Label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((fmt) => (
                <Button
                  key={fmt}
                  variant={formats.includes(fmt) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFormat(fmt)}
                >
                  {fmt}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !url.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Scraping..." : "Scrape"}
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
            icon={Globe}
            title="No results yet"
            description="Enter a URL above and click Scrape to extract content"
          />
        )
      )}
    </div>
  );
}
