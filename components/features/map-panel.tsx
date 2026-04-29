"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { useHistory } from "@/hooks/use-history";
import { Map, Loader2, Copy, ExternalLink } from "lucide-react";

export default function MapPanel() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const { addEntry } = useHistory("map");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setUrls([]);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), limit, search: search.trim() || undefined }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Map failed");

      const links: string[] = data.links || data.urls || [];
      setUrls(links);
      addEntry({ url, limit }, `${url} (${links.length} URLs)`);
      toast.success(`Found ${links.length} URLs`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Map failed");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(urls.join("\n"));
    toast.success("Copied all URLs");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="text-muted-foreground">Discover all indexed URLs on a website</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Enter the site URL and optional filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Search filter</Label>
              <Input placeholder="Optional keyword" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !url.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Mapping..." : "Map Site"}
            </Button>
            {loading && (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {urls.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">{urls.length} URLs found</CardTitle>
            <Button variant="ghost" size="sm" onClick={copyAll}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {urls.map((u, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50">
                    <span className="truncate mr-2 font-mono text-xs">{u}</span>
                    <a href={u} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <EmptyState icon={Map} title="No URLs yet" description="Enter a site URL and click Map Site to discover pages" />
        )
      )}
    </div>
  );
}
