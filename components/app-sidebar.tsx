"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/logo";
import {
  Globe,
  Map,
  FileText,
  Search,
  Bot,
  Upload,
  MousePointerClick,
  Layers,
  ListChecks,
  GitCompare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type TabId =
  | "scrape"
  | "map"
  | "extract"
  | "search"
  | "agent"
  | "parse"
  | "interact"
  | "crawl"
  | "batch"
  | "changes";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  { id: "scrape", label: "Scrape", icon: Globe, description: "Scrape a single URL" },
  { id: "map", label: "Map", icon: Map, description: "Discover site URLs" },
  { id: "extract", label: "Extract", icon: FileText, description: "Extract structured data" },
  { id: "search", label: "Search", icon: Search, description: "Web search" },
  { id: "agent", label: "Agent", icon: Bot, description: "AI agent research" },
  { id: "parse", label: "Parse", icon: Upload, description: "Parse documents" },
  { id: "interact", label: "Interact", icon: MousePointerClick, description: "Interact with pages" },
  { id: "crawl", label: "Crawl", icon: Layers, description: "Crawl entire sites" },
  { id: "batch", label: "Batch Scrape", icon: ListChecks, description: "Scrape multiple URLs" },
  { id: "changes", label: "Changes", icon: GitCompare, description: "Track content changes" },
];

interface AppSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold text-sm">FireScraper</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-7 w-7", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-3 h-9",
                  collapsed && "justify-center px-0"
                )}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate text-sm">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
