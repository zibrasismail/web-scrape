"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResultViewer } from "@/components/shared/result-viewer";
import { EmptyState } from "@/components/shared/empty-state";
import { useHistory } from "@/hooks/use-history";
import { FileText, Loader2, Plus, X } from "lucide-react";

export default function ExtractPanel() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [prompt, setPrompt] = useState("");
  const [schema, setSchema] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { addEntry } = useHistory("extract");

  const handleSubmit = async () => {
    const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
    if (cleanUrls.length === 0) return;
    setLoading(true);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      let parsedSchema: Record<string, unknown> | undefined;
      if (schema.trim()) {
        try {
          parsedSchema = JSON.parse(schema);
        } catch {
          toast.error("Invalid JSON schema");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: cleanUrls,
          prompt: prompt.trim() || undefined,
          schema: parsedSchema,
        }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extract failed");
      setResult(data);
      addEntry({ urls: cleanUrls, prompt }, cleanUrls.join(", "));
      toast.success("Extraction complete");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Extract failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Extract</h1>
        <p className="text-muted-foreground">Extract structured data from web pages using AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Add URLs and describe what to extract</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URLs</Label>
            {urls.map((u, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={u}
                  onChange={(e) => {
                    const next = [...urls];
                    next[i] = e.target.value;
                    setUrls(next);
                  }}
                />
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setUrls(urls.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setUrls([...urls, ""])}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add URL
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              placeholder="Describe what data to extract..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>JSON Schema (optional)</Label>
            <Textarea
              placeholder='{"type":"object","properties":{"title":{"type":"string"}}}'
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || urls.every((u) => !u.trim())}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Extracting..." : "Extract"}
            </Button>
            {loading && (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result ? (
        <ResultViewer data={result} />
      ) : (
        !loading && (
          <EmptyState icon={FileText} title="No results yet" description="Add URLs and a prompt to extract structured data" />
        )
      )}
    </div>
  );
}
