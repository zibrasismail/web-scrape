"use client";

import { useState } from "react";
import { Loader2, ExternalLink, FileText, X } from "lucide-react";

interface MapLink {
  url: string;
  title?: string;
}

interface MapResult {
  links?: (string | MapLink)[];
}

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

export function MapTab() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);
  const [scrapedUrl, setScrapedUrl] = useState<string | null>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapeResult | null>(null);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);

  const handleMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setScrapedContent(null);
    setScrapedUrl(null);

    try {
      const response = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, limit }),
      });

      if (!response.ok) {
        throw new Error("Failed to map website");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeUrl = async (urlToScrape: string) => {
    setScrapingUrl(urlToScrape);
    setError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScrape, formats: ["markdown"] }),
      });

      if (!response.ok) {
        throw new Error("Failed to scrape URL");
      }

      const data = await response.json();
      setScrapedUrl(urlToScrape);
      setScrapedContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setScrapingUrl(null);
    }
  };

  const closeScrapeResult = () => {
    setScrapedUrl(null);
    setScrapedContent(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Map Website</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover all indexed URLs on a website.
        </p>
      </div>

      <form onSubmit={handleMap} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            Website URL
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
          <label htmlFor="limit" className="block text-sm font-medium mb-2">
            Maximum URLs (1-100)
          </label>
          <input
            id="limit"
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10);
              setLimit(Number.isNaN(val) ? 10 : val);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mapping...
            </>
          ) : (
            "Map Website"
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result?.links && (
        <div>
          <h3 className="font-semibold mb-2">
            Found {result.links.length} URLs
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {result.links.map((link, index) => {
              const linkUrl = typeof link === "string" ? link : link.url;
              const linkTitle = typeof link === "string" ? undefined : link.title;
              const isScrapingThis = scrapingUrl === linkUrl;
              
              return (
                <div
                  key={`${linkUrl}-${index}`}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    {linkTitle && (
                      <p className="text-sm font-medium truncate mb-1">
                        {linkTitle}
                      </p>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                      {linkUrl}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleScrapeUrl(linkUrl)}
                      disabled={isScrapingThis}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded flex items-center gap-1.5 transition-colors"
                      title="Scrape this URL"
                    >
                      {isScrapingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scraping...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Scrape</span>
                        </>
                      )}
                    </button>
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scrapedContent && scrapedUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg">Scraped Content</h3>
              <button
                type="button"
                onClick={closeScrapeResult}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {scrapedContent.metadata && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <h4 className="font-semibold">Metadata</h4>
                  <div className="space-y-1 text-sm">
                    {scrapedContent.metadata.title && (
                      <p>
                        <span className="font-medium">Title:</span>{" "}
                        {scrapedContent.metadata.title}
                      </p>
                    )}
                    {scrapedContent.metadata.description && (
                      <p>
                        <span className="font-medium">Description:</span>{" "}
                        {scrapedContent.metadata.description}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">URL:</span>{" "}
                      <a
                        href={scrapedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {scrapedUrl}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Content</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-[500px] overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {scrapedContent.markdown || scrapedContent.html}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={closeScrapeResult}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
