"use client";

import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";

interface ScrapeResult {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
}

export function ScrapeTab() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = result?.markdown || result?.html;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: [format] }),
      });

      if (!response.ok) {
        throw new Error("Failed to scrape URL");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Scrape URL</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Extract content from a single URL in markdown or HTML format.
        </p>
      </div>

      <form onSubmit={handleScrape} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL to Scrape
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium mb-2">
            Output Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as "markdown" | "html")}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scraping...
            </>
          ) : (
            "Scrape URL"
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.metadata && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
              <h3 className="font-semibold">Metadata</h3>
              <div className="space-y-1 text-sm">
                {result.metadata.title && (
                  <p>
                    <span className="font-medium">Title:</span>{" "}
                    {result.metadata.title}
                  </p>
                )}
                {result.metadata.description && (
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {result.metadata.description}
                  </p>
                )}
                {result.metadata.language && (
                  <p>
                    <span className="font-medium">Language:</span>{" "}
                    {result.metadata.language}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Content</h3>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-[500px] overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {result.markdown || result.html}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
