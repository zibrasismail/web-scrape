"use client";

import { Logo } from "./logo";
import { FileText, Map, FileSearch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "scrape" | "map" | "extract" | "search";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: "scrape" as const, label: "Scrape", icon: FileText },
  { id: "map" as const, label: "Map", icon: Map },
  { id: "extract" as const, label: "Extract", icon: FileSearch },
  { id: "search" as const, label: "Search", icon: Search },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-xl font-bold">Web Scraper</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Powered by Firecrawl
        </p>
      </div>
    </div>
  );
}
