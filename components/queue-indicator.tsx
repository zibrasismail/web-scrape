"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QueueState {
  inFlight: number;
  queued: number;
  limit: number;
}

export function QueueIndicator() {
  const [state, setState] = useState<QueueState>({
    inFlight: 0,
    queued: 0,
    limit: 2,
  });

  useEffect(() => {
    const es = new EventSource("/api/queue/stream");
    es.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
      } catch {}
    };
    return () => es.close();
  }, []);

  const busy = state.inFlight > 0 || state.queued > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Activity
              className={`h-4 w-4 ${busy ? "text-amber-500 animate-pulse" : "text-muted-foreground"}`}
            />
            {busy && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                {state.inFlight}/{state.limit}
                {state.queued > 0 && ` +${state.queued}`}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {state.inFlight} in-flight / {state.limit} max
            {state.queued > 0 && ` · ${state.queued} queued`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
