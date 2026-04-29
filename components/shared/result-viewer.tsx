"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResultViewerProps {
  data: Record<string, unknown>;
  className?: string;
}

export function ResultViewer({ data, className }: ResultViewerProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const markdown = data.markdown as string | undefined;
  const html = data.html as string | undefined;
  const json = data.json ?? data.data ?? data.extract;
  const screenshot = data.screenshot as string | undefined;

  const tabs: { id: string; label: string; content: React.ReactNode }[] = [];

  if (markdown) {
    tabs.push({
      id: "markdown",
      label: "Markdown",
      content: (
        <pre className="whitespace-pre-wrap break-words text-sm font-mono p-4">
          {markdown}
        </pre>
      ),
    });
  }

  if (json) {
    tabs.push({
      id: "json",
      label: "JSON",
      content: (
        <pre className="whitespace-pre-wrap break-words text-sm font-mono p-4">
          {JSON.stringify(json, null, 2)}
        </pre>
      ),
    });
  }

  if (html) {
    tabs.push({
      id: "html",
      label: "HTML",
      content: (
        <pre className="whitespace-pre-wrap break-words text-sm font-mono p-4">
          {html}
        </pre>
      ),
    });
  }

  if (screenshot) {
    tabs.push({
      id: "screenshot",
      label: "Screenshot",
      content: (
        <div className="p-4 flex justify-center">
          {/* biome-ignore lint/performance/noImgElement: screenshot is a base64 data URL */}
          <img
            src={screenshot}
            alt="Screenshot"
            className="max-w-full rounded-md border"
          />
        </div>
      ),
    });
  }

  if (tabs.length === 0) {
    tabs.push({
      id: "raw",
      label: "Raw",
      content: (
        <pre className="whitespace-pre-wrap break-words text-sm font-mono p-4">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  }

  const copyContent = (tabId: string) => {
    let text = "";
    if (tabId === "markdown") text = markdown ?? "";
    else if (tabId === "html") text = html ?? "";
    else if (tabId === "json") text = JSON.stringify(json, null, 2);
    else text = JSON.stringify(data, null, 2);

    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const downloadContent = (tabId: string) => {
    let text = "";
    let ext = "txt";
    if (tabId === "markdown") {
      text = markdown ?? "";
      ext = "md";
    } else if (tabId === "html") {
      text = html ?? "";
      ext = "html";
    } else if (tabId === "json") {
      text = JSON.stringify(json, null, 2);
      ext = "json";
    } else {
      text = JSON.stringify(data, null, 2);
      ext = "json";
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <Tabs defaultValue={tabs[0].id}>
        <div className="flex items-center justify-between">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => copyContent(tabs[0].id)}
            >
              {copiedTab ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => downloadContent(tabs[0].id)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ScrollArea className="h-[500px] rounded-md border bg-muted/30">
              {tab.content}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
