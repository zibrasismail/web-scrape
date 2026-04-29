"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResultViewer } from "@/components/shared/result-viewer";
import { EmptyState } from "@/components/shared/empty-state";
import { useHistory } from "@/hooks/use-history";
import { Upload, Loader2, FileUp } from "lucide-react";

export default function ParsePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { addEntry } = useHistory("parse");

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setResult(data);
      addEntry({ filename: file.name, size: file.size }, file.name);
      toast.success("Document parsed");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parse</h1>
        <p className="text-muted-foreground">Upload and parse documents (PDF, DOCX, etc.) into LLM-ready data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Select a file to parse (max 50 MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>File</Label>
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{file ? file.name : "Click to select a file"}</p>
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.xlsx,.csv,.txt,.md,.html"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !file}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Parsing..." : "Parse Document"}
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
          <EmptyState icon={Upload} title="No results yet" description="Upload a document to parse it into structured data" />
        )
      )}
    </div>
  );
}
