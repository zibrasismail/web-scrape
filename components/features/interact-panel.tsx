"use client";

import { Loader2, MousePointerClick, Play, Send, Square } from "lucide-react";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

export default function InteractPanel() {
  const [url, setUrl] = useState("");
  const [scrapeId, setScrapeId] = useState<string | null>(null);
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startSession = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setScrapeId(null);
    setLiveViewUrl(null);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/interact/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), formats: ["markdown"] }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session");

      if (data.scrapeId) {
        setScrapeId(data.scrapeId);
        if (data.metadata?.liveViewUrl) {
          setLiveViewUrl(data.metadata.liveViewUrl);
        }
        toast.success("Session started");
      } else {
        toast.error(
          "No scrapeId returned — Interact may not be available for this URL",
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(
        err instanceof Error ? err.message : "Failed to start session",
      );
    } finally {
      setLoading(false);
    }
  };

  const sendInteraction = async () => {
    if (!scrapeId || !prompt.trim()) return;
    setInteracting(true);

    try {
      const res = await fetch(`/api/interact/${scrapeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interaction failed");
      setResult(data);
      setPrompt("");
      toast.success("Interaction complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Interaction failed");
    } finally {
      setInteracting(false);
    }
  };

  const stopSession = async () => {
    if (!scrapeId) return;
    try {
      await fetch(`/api/interact/${scrapeId}`, { method: "DELETE" });
      toast.info("Session stopped");
    } catch {}
    setScrapeId(null);
    setLiveViewUrl(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interact</h1>
        <p className="text-muted-foreground">
          Interact with web pages using AI prompts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Start a browser session to interact with a page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={!!scrapeId}
            />
          </div>
          <div className="flex gap-2 items-center">
            {!scrapeId ? (
              <Button onClick={startSession} disabled={loading || !url.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {loading ? "Starting..." : "Start Session"}
              </Button>
            ) : (
              <>
                <Badge variant="success">Session Active</Badge>
                <Button variant="destructive" size="sm" onClick={stopSession}>
                  <Square className="h-3.5 w-3.5 mr-1" /> Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {liveViewUrl && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Live View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={liveViewUrl}
              className="w-full h-[400px] rounded-b-xl border-t"
              title="Live browser view"
              sandbox="allow-scripts allow-same-origin"
            />
          </CardContent>
        </Card>
      )}

      {scrapeId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Send Command</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Click the login button and fill in the email field..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <Button
              onClick={sendInteraction}
              disabled={interacting || !prompt.trim()}
            >
              {interacting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {interacting ? "Interacting..." : "Send"}
            </Button>
          </CardContent>
        </Card>
      )}

      {result ? (
        <ResultViewer data={result} />
      ) : (
        !scrapeId &&
        !loading && (
          <EmptyState
            icon={MousePointerClick}
            title="No active session"
            description="Enter a URL and start a session to interact with the page"
          />
        )
      )}
    </div>
  );
}
