import { gate } from "@/lib/concurrency";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (state: {
        inFlight: number;
        queued: number;
        limit: number;
      }) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(state)}\n\n`),
          );
        } catch {
          unsub();
        }
      };

      send(gate.getState());
      const unsub = gate.subscribe(send);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
          unsub();
        }
      }, 15_000);

      const onClose = () => {
        clearInterval(keepAlive);
        unsub();
      };

      (
        controller as unknown as { signal?: AbortSignal }
      ).signal?.addEventListener("abort", onClose);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
