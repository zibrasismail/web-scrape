import { randomUUID } from "node:crypto";

export class QueueTimeoutError extends Error {
  code = "QUEUE_TIMEOUT" as const;
  constructor(public waitedMs: number) {
    super(`Queue timeout after ${waitedMs}ms`);
    this.name = "QueueTimeoutError";
  }
}

interface Waiter {
  resolve: (value: {
    release: () => void;
    ticket: string;
    waitedMs: number;
  }) => void;
  reject: (err: Error) => void;
  ticket: string;
  ts: number;
  timer?: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  onAbort?: () => void;
}

type Listener = (state: {
  inFlight: number;
  queued: number;
  limit: number;
}) => void;

export class FirecrawlGate {
  private limit: number;
  private inFlight = 0;
  private queue: Waiter[] = [];
  private listeners = new Set<Listener>();

  constructor(limit?: number) {
    this.limit = limit ?? Number(process.env.FIRECRAWL_CONCURRENCY ?? 2);
  }

  getState() {
    return {
      inFlight: this.inFlight,
      queued: this.queue.length,
      limit: this.limit,
    };
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    for (const l of this.listeners) {
      try {
        l(state);
      } catch {}
    }
  }

  acquire(opts?: { timeoutMs?: number; signal?: AbortSignal }): Promise<{
    release: () => void;
    ticket: string;
    waitedMs: number;
  }> {
    const ticket = randomUUID();
    const timeoutMs = opts?.timeoutMs ?? 30_000;

    if (this.inFlight < this.limit) {
      this.inFlight++;
      this.notify();
      let released = false;
      return Promise.resolve({
        release: () => {
          if (released) return;
          released = true;
          this.inFlight--;
          this.notify();
          this.drain();
        },
        ticket,
        waitedMs: 0,
      });
    }

    return new Promise<{
      release: () => void;
      ticket: string;
      waitedMs: number;
    }>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject, ticket, ts: Date.now() };

      if (timeoutMs > 0) {
        waiter.timer = setTimeout(() => {
          this.removeWaiter(waiter);
          reject(new QueueTimeoutError(Date.now() - waiter.ts));
        }, timeoutMs);
      }

      if (opts?.signal) {
        waiter.signal = opts.signal;
        waiter.onAbort = () => {
          this.removeWaiter(waiter);
          reject(new DOMException("Aborted", "AbortError"));
        };
        opts.signal.addEventListener("abort", waiter.onAbort, { once: true });
      }

      this.queue.push(waiter);
      this.notify();
    });
  }

  private removeWaiter(waiter: Waiter) {
    const idx = this.queue.indexOf(waiter);
    if (idx !== -1) this.queue.splice(idx, 1);
    if (waiter.timer) clearTimeout(waiter.timer);
    if (waiter.signal && waiter.onAbort) {
      waiter.signal.removeEventListener("abort", waiter.onAbort);
    }
    this.notify();
  }

  private drain() {
    while (this.inFlight < this.limit && this.queue.length > 0) {
      const waiter = this.queue.shift()!;
      if (waiter.timer) clearTimeout(waiter.timer);
      if (waiter.signal && waiter.onAbort) {
        waiter.signal.removeEventListener("abort", waiter.onAbort);
      }

      this.inFlight++;
      this.notify();

      let released = false;
      waiter.resolve({
        release: () => {
          if (released) return;
          released = true;
          this.inFlight--;
          this.notify();
          this.drain();
        },
        ticket: waiter.ticket,
        waitedMs: Date.now() - waiter.ts,
      });
    }
  }
}

export const gate = new FirecrawlGate();
