"use client";

import { lazy, Suspense, useState } from "react";
import { AppSidebar, type TabId } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { Skeleton } from "@/components/ui/skeleton";

const ScrapePanel = lazy(() => import("@/components/features/scrape-panel"));
const MapPanel = lazy(() => import("@/components/features/map-panel"));
const ExtractPanel = lazy(() => import("@/components/features/extract-panel"));
const SearchPanel = lazy(() => import("@/components/features/search-panel"));
const AgentPanel = lazy(() => import("@/components/features/agent-panel"));
const ParsePanel = lazy(() => import("@/components/features/parse-panel"));
const InteractPanel = lazy(
  () => import("@/components/features/interact-panel"),
);
const CrawlPanel = lazy(() => import("@/components/features/crawl-panel"));
const BatchPanel = lazy(() => import("@/components/features/batch-panel"));
const ChangesPanel = lazy(() => import("@/components/features/changes-panel"));

const panels: Record<TabId, React.LazyExoticComponent<React.ComponentType>> = {
  scrape: ScrapePanel,
  map: MapPanel,
  extract: ExtractPanel,
  search: SearchPanel,
  agent: AgentPanel,
  parse: ParsePanel,
  interact: InteractPanel,
  crawl: CrawlPanel,
  batch: BatchPanel,
  changes: ChangesPanel,
};

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("scrape");
  const Panel = panels[activeTab];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6">
            <Suspense fallback={<PanelSkeleton />}>
              <Panel />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
