"use client";

import { Github, Key } from "lucide-react";
import { QueueIndicator } from "@/components/queue-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const hasKey = true;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <QueueIndicator />
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={hasKey ? "success" : "destructive"} className="gap-1">
          <Key className="h-3 w-3" />
          API Key
        </Badge>
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
