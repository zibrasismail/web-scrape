# Web Scraper

A modern web scraping application powered by Firecrawl API with Next.js and TypeScript.

## Features

- **Scrape**: Extract content from a single URL in markdown or HTML format
- **Map**: Discover all indexed URLs on a website
- **Extract**: Extract structured information from web pages using AI
- **Search**: Search the web and get relevant results with metadata

## Prerequisites

- Node.js 18+ installed
- A Firecrawl API key (get one from [firecrawl.dev](https://firecrawl.dev))

## Setup Instructions

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

### 📄 Parse
- Upload local documents (PDF, DOCX, PPTX, CSV, etc.) up to 50 MB
- Convert to LLM-ready markdown or structured JSON

### 🖱️ Interact
- Start a browser session on any URL, get a live view iframe
- Send AI prompts to interact with the page (click, type, navigate)
- Stop session when done

### 🕸️ Crawl
- Crawl entire websites with configurable page limit and max depth
- Long-running job with real-time progress polling and cancel support
- Holds a concurrency slot for the entire job duration

### 📦 Batch Scrape
- Scrape multiple URLs in a single long-running job
- Progress bar and cancel support
- Holds a concurrency slot for the entire job duration

### 🔄 Change Tracking
- Track content changes on a webpage using Firecrawl's `changeTracking` format

## 🚦 Concurrency Gate

Firecrawl limits concurrent API requests. FireScraper enforces this with an in-memory semaphore:

- **Default limit**: 2 concurrent requests (configurable via `FIRECRAWL_CONCURRENCY`)
- **Overflow**: FIFO queue with 30-second timeout → `503 QUEUE_TIMEOUT`
- **Long-running jobs** (Crawl, Batch Scrape, Agent) hold a slot for their entire lifetime
- **Live indicator**: Topbar badge shows in-flight/queued requests via SSE (`/api/queue/stream`)
- **Abort propagation**: Cancelling a client fetch removes the waiter server-side

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firecrawl API key ([get one here](https://firecrawl.dev))

### Installation

```bash
git clone <your-repo-url>
cd web-scraper
npm install
```

Create `.env.local`:
```env
FIRECRAWL_API_KEY=your_api_key_here
FIRECRAWL_CONCURRENCY=2           # optional, default 2
FIRECRAWL_JOB_TIMEOUT_MS=1800000  # optional, default 30 min
```

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
web-scraper/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts          # Scrape endpoint
│   │   ├── map/route.ts             # Map endpoint
│   │   ├── extract/route.ts         # Extract endpoint
│   │   ├── search/route.ts          # Search endpoint
│   │   ├── agent/route.ts           # Agent endpoint
│   │   ├── parse/route.ts           # Parse (file upload)
│   │   ├── interact/
│   │   │   ├── start/route.ts       # Start interact session
│   │   │   └── [scrapeId]/route.ts  # Send prompt / stop session
│   │   ├── crawl/
│   │   │   ├── route.ts             # Start crawl job
│   │   │   └── [id]/route.ts        # Poll / cancel crawl
│   │   ├── batch/
│   │   │   ├── route.ts             # Start batch scrape
│   │   │   └── [id]/route.ts        # Poll / cancel batch
│   │   ├── changes/route.ts         # Change tracking
│   │   └── queue/stream/route.ts    # SSE queue status
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # Dashboard shell
├── components/
│   ├── features/                    # 10 feature panels
│   ├── shared/                      # ResultViewer, EmptyState
│   ├── ui/                          # shadcn/ui primitives
│   ├── app-sidebar.tsx              # Collapsible sidebar nav
│   ├── topbar.tsx                   # Theme toggle, queue indicator
│   ├── theme-provider.tsx           # next-themes provider
│   ├── theme-toggle.tsx             # Dark/light toggle
│   ├── queue-indicator.tsx          # Live SSE queue badge
│   └── logo.tsx
├── hooks/
│   └── use-history.ts               # localStorage history hook
├── lib/
│   ├── concurrency.ts               # FirecrawlGate (semaphore + FIFO queue)
│   ├── firecrawl-client.ts          # SDK singleton + runShort / runJob
│   ├── job-store.ts                 # In-memory job tracking
│   ├── url-validation.ts            # SSRF protection
│   ├── rate-limit.ts                # Token-bucket rate limiter
│   ├── api-helpers.ts               # Shared route helpers
│   └── utils.ts                     # cn() utility
└── ...config files
```

## 🛠️ Technologies

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Components**: Radix UI primitives, Lucide icons
- **State**: React hooks, localStorage for history
- **API**: Firecrawl JavaScript SDK v4.20+
- **Toasts**: Sonner
- **Theme**: next-themes (dark/light/system)
- **Linting**: Biome
- **Fonts**: Geist Sans & Geist Mono

## 🔑 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FIRECRAWL_API_KEY` | Your Firecrawl API key | Yes | — |
| `FIRECRAWL_CONCURRENCY` | Max concurrent Firecrawl requests | No | `2` |
| `FIRECRAWL_JOB_TIMEOUT_MS` | Max duration for long-running jobs (ms) | No | `1800000` |

## 📝 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scrape` | POST | Scrape a single URL |
| `/api/map` | POST | Discover URLs on a site |
| `/api/extract` | POST | Extract structured data |
| `/api/search` | POST | Search the web |
| `/api/agent` | POST | AI agent research |
| `/api/parse` | POST | Parse uploaded documents |
| `/api/interact/start` | POST | Start interact session |
| `/api/interact/[scrapeId]` | POST/DELETE | Send prompt / stop session |
| `/api/crawl` | POST | Start crawl job |
| `/api/crawl/[id]` | GET/DELETE | Poll / cancel crawl |
| `/api/batch` | POST | Start batch scrape |
| `/api/batch/[id]` | GET/DELETE | Poll / cancel batch |
| `/api/changes` | POST | Track content changes |
| `/api/queue/stream` | GET (SSE) | Live queue status |

## 🎨 UI Features

- **Dark/Light/System Mode**: Theme toggle persists via `next-themes`
- **Collapsible Sidebar**: 10-feature navigation, collapses to icons
- **Queue Indicator**: Real-time SSE badge showing in-flight and queued API calls
- **Job History**: Per-feature localStorage history with rehydration (last 20 entries)
- **Result Viewer**: Tabbed display for markdown/JSON/HTML/screenshot with copy & download
- **Progress Tracking**: Live progress bars for Crawl and Batch Scrape jobs
- **Live View**: Embedded iframe for Interact sessions
- **Lazy Loading**: Feature panels are code-split with React.lazy + Suspense
- **AbortController**: All client fetches support cancellation
- **SSRF Protection**: All URL inputs validated against internal/private ranges
- **Rate Limiting**: 30 req/min per IP across all API routes

## 🔧 Troubleshooting

### "FIRECRAWL_API_KEY not configured"
Ensure `.env.local` exists with a valid API key.

### "Server busy, please retry" (503 QUEUE_TIMEOUT)
All concurrency slots are occupied and the queue timed out. Reduce concurrent usage or increase `FIRECRAWL_CONCURRENCY`.

### Build Errors
```bash
npm run build
```

### Lint / Format
```bash
npx biome check --write .
