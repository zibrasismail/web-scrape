"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ScrapeTab } from "@/components/scrape-tab";
import { MapTab } from "@/components/map-tab";
import { ExtractTab } from "@/components/extract-tab";
import { SearchTab } from "@/components/search-tab";

type Tab = "scrape" | "map" | "extract" | "search";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("scrape");

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeTab === "scrape" && <ScrapeTab />}
          {activeTab === "map" && <MapTab />}
          {activeTab === "extract" && <ExtractTab />}
          {activeTab === "search" && <SearchTab />}
        </div>
      </main>
    </div>
  );
}
