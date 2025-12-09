"use client";

import { useState } from "react";
import { Loader2, ExternalLink, FileText, X, Copy, Check } from "lucide-react";

interface SearchResult {
  url: string;
  title?: string;
  description?: string;
}

interface SearchResponse {
  results?: SearchResult[];
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

export function SearchTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);
  const [scrapedUrl, setScrapedUrl] = useState<string | null>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapeResult | null>(null);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = scrapedContent?.markdown || scrapedContent?.html;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setScrapedContent(null);
    setScrapedUrl(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) {
        throw new Error("Failed to search");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
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
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Search the Web</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Search the web and get relevant results with metadata.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-2">
            Search Query
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="limit" className="block text-sm font-medium mb-2">
            Maximum Results (1-20)
          </label>
          <input
            id="limit"
            type="number"
            min="1"
            max="20"
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
              Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">
            Found {results.length} results
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-auto">
            {results.map((result, index) => {
              const isScrapingThis = scrapingUrl === result.url;

              return (
                <div
                  key={`${result.url}-${index}`}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {result.title && (
                        <h4 className="font-medium text-base mb-1 line-clamp-2">
                          {result.title}
                        </h4>
                      )}
                      {result.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {result.description}
                        </p>
                      )}
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                      >
                        {result.url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleScrapeUrl(result.url)}
                      disabled={isScrapingThis}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded flex items-center gap-1.5 transition-colors"
                      title="Scrape this result"
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
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm rounded flex items-center gap-1.5 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
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

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Content
                  </>
                )}
              </button>
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
